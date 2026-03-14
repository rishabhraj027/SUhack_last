import { Request, Response } from 'express';
import prisma from '../config/db.js';

// ── Shared include for full bounty queries ──────────────────────────
const bountyInclude = {
  founder: { select: { id: true, name: true, avatarUrl: true } },
  claimedBy: { select: { id: true, name: true, avatarUrl: true } },
  bids: {
    include: { student: { select: { id: true, name: true, score: true, avatarUrl: true } } },
    orderBy: { createdAt: 'desc' as const },
  },
  milestones: { orderBy: { createdAt: 'asc' as const } },
  feedbacks: {
    include: { sender: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
};

// ── Map Prisma bounty → frontend shape ──────────────────────────────
function mapBounty(b: any) {
  // Separate the final review (feedback with rating) from iteration feedback
  const review = b.feedbacks?.find((f: any) => f.rating !== null);
  const feedbackHistory = (b.feedbacks || [])
    .filter((f: any) => f.rating === null)
    .map((f: any) => ({
      id: f.id,
      sender: f.sender.id === b.founderId ? 'founder' : 'student',
      message: f.message,
      screenshotUrl: f.screenshotUrl || undefined,
      timestamp: f.createdAt.toISOString(),
    }));

  return {
    id: b.id,
    title: b.title,
    description: b.description,
    founderId: b.founderId,
    founderName: b.founder?.name || '',
    founderAvatarUrl: b.founder?.avatarUrl || undefined,
    category: b.category,
    price: Number(b.price),
    deadline: b.deadline ? b.deadline.toISOString() : undefined,
    status: b.status,
    tags: b.tags || [],
    submissionLink: b.submissionLink || undefined,
    submissionScreenshotUrl: b.submissionScreenshotUrl || undefined,
    posted_by: b.founder?.name || '',
    claimed_by: b.claimedById || undefined,
    bids: (b.bids || []).map((bid: any) => ({
      studentId: bid.studentId,
      studentName: bid.student?.name || '',
      studentAvatarUrl: bid.student?.avatarUrl || undefined,
      score: Number(bid.student?.score || 0),
      bidPrice: Number(bid.bidPrice),
      message: bid.message || undefined,
      counterOfferPrice: bid.counterOfferPrice ? Number(bid.counterOfferPrice) : undefined,
      counterOfferMessage: bid.counterOfferMessage || undefined,
      pocRequested: bid.pocRequested,
      pocStatus: bid.pocStatus || undefined,
      pocSubmissionLink: bid.pocSubmissionLink || undefined,
      pocSubmissionScreenshotUrl: bid.pocSubmissionScreenshotUrl || undefined,
    })),
    milestones: (b.milestones || []).map((m: any) => ({
      id: m.id,
      title: m.title,
      description: m.description || undefined,
      status: m.status,
      createdAt: m.createdAt.toISOString(),
      completedAt: m.completedAt ? m.completedAt.toISOString() : undefined,
    })),
    feedbackHistory,
    review: review
      ? {
          rating: Number(review.rating),
          comment: review.message,
          timestamp: review.createdAt.toISOString(),
          screenshotUrl: review.screenshotUrl || undefined,
        }
      : undefined,
    createdAt: b.createdAt.toISOString(),
  };
}

// ── Helper: fetch single bounty by id with full includes ────────────
async function fetchBountyFull(id: string) {
  return prisma.bounty.findUnique({ where: { id }, include: bountyInclude });
}

// ══════════════════════════════════════════════════════════════════════
// 1. GET /api/bounties
// ══════════════════════════════════════════════════════════════════════
export async function getBounties(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const role = (req as any).user.role;
    const status = req.query.status as string | undefined;

    // Exclude expired bounties with no bids (OPEN + deadline passed)
    const notExpiredNoBid = {
      NOT: {
        AND: [
          { deadline: { not: null, lt: new Date() } },
          { status: 'OPEN' },
        ],
      },
    };

    let where: any = {};

    if (role === 'Business') {
      // Business users only see their own bounties
      where = { ...notExpiredNoBid, founderId: userId };
      if (status) where.status = status;
    } else {
      // JuniorPro: see OPEN/BIDDING (discovery) + bounties they've bid on or are assigned to
      const orClause = [
        { status: { in: ['OPEN', 'BIDDING'] } },
        { bids: { some: { studentId: userId } } },
        { claimedById: userId },
      ];
      if (status) {
        where = { AND: [notExpiredNoBid, { status }, { OR: orClause }] };
      } else {
        where = { AND: [notExpiredNoBid, { OR: orClause }] };
      }
    }

    const bounties = await prisma.bounty.findMany({
      where,
      include: bountyInclude,
      orderBy: { createdAt: 'desc' },
    });

    // Also clean up: delete expired no-bid bounties in the background
    prisma.bounty.deleteMany({
      where: {
        status: 'OPEN',
        deadline: { not: null, lt: new Date() },
      },
    }).catch((err) => console.error('[cleanup expired bounties]', err));

    res.json(bounties.map(mapBounty));
  } catch (err) {
    console.error('[getBounties]', err);
    res.status(500).json({ error: 'Failed to fetch bounties' });
  }
}

// ══════════════════════════════════════════════════════════════════════
// 2. POST /api/bounties
// ══════════════════════════════════════════════════════════════════════
export async function createBounty(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const { title, description, category, price, deadline, tags } = req.body;

    if (!title || !description || price == null) {
      res.status(400).json({ error: 'Title, description, and price are required' });
      return;
    }

    const bounty = await prisma.bounty.create({
      data: {
        founderId: userId,
        title,
        description,
        category: category || 'Miscellaneous',
        price: Number(price),
        deadline: deadline ? new Date(deadline) : null,
        tags: tags || [],
        status: 'OPEN',
      },
      include: bountyInclude,
    });

    res.status(201).json(mapBounty(bounty));
  } catch (err) {
    console.error('[createBounty]', err);
    res.status(500).json({ error: 'Failed to create bounty' });
  }
}

// ══════════════════════════════════════════════════════════════════════
// 3. POST /api/bounties/:id/bids
// ══════════════════════════════════════════════════════════════════════
export async function placeBid(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const bountyId = req.params.id as string;
    const { bidPrice, message } = req.body;

    if (bidPrice == null) {
      res.status(400).json({ error: 'bidPrice is required' });
      return;
    }

    const bounty = await prisma.bounty.findUnique({ where: { id: bountyId } });
    if (!bounty) { res.status(404).json({ error: 'Bounty not found' }); return; }
    if (bounty.founderId === userId) { res.status(403).json({ error: 'Cannot bid on your own bounty' }); return; }
    if (bounty.status !== 'OPEN' && bounty.status !== 'BIDDING') {
      res.status(400).json({ error: 'Bounty is not open for bidding' });
      return;
    }
    if (bounty.deadline && new Date(bounty.deadline) < new Date()) {
      res.status(400).json({ error: 'Bounty deadline has passed' });
      return;
    }

    // Check duplicate
    const existing = await prisma.bid.findUnique({ where: { bountyId_studentId: { bountyId, studentId: userId } } });
    if (existing) { res.status(400).json({ error: 'You have already bid on this bounty' }); return; }

    await prisma.$transaction([
      prisma.bid.create({ data: { bountyId, studentId: userId, bidPrice: Number(bidPrice), message: message || '' } }),
      prisma.bounty.update({ where: { id: bountyId }, data: { status: 'BIDDING' } }),
    ]);

    const updated = await fetchBountyFull(bountyId);
    res.status(201).json(mapBounty(updated));
  } catch (err) {
    console.error('[placeBid]', err);
    res.status(500).json({ error: 'Failed to place bid' });
  }
}

// ══════════════════════════════════════════════════════════════════════
// 4. POST /api/bounties/:id/bids/:studentId/counter
// ══════════════════════════════════════════════════════════════════════
export async function founderCounter(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const bountyId = req.params.id as string;
    const studentId = req.params.studentId as string;
    const { price, message } = req.body;

    if (price == null) { res.status(400).json({ error: 'price is required' }); return; }

    const bounty = await prisma.bounty.findUnique({ where: { id: bountyId } });
    if (!bounty) { res.status(404).json({ error: 'Bounty not found' }); return; }
    if (bounty.founderId !== userId) { res.status(403).json({ error: 'Not authorized' }); return; }

    const bid = await prisma.bid.findUnique({ where: { bountyId_studentId: { bountyId, studentId } } });
    if (!bid) { res.status(404).json({ error: 'Bid not found' }); return; }

    await prisma.bid.update({
      where: { id: bid.id },
      data: { counterOfferPrice: Number(price), counterOfferMessage: message || '' },
    });

    const updated = await fetchBountyFull(bountyId);
    res.json(mapBounty(updated));
  } catch (err) {
    console.error('[founderCounter]', err);
    res.status(500).json({ error: 'Failed to counter offer' });
  }
}

// ══════════════════════════════════════════════════════════════════════
// 5. PUT /api/bounties/:id/bids/:studentId/respond
// ══════════════════════════════════════════════════════════════════════
export async function respondToCounter(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const bountyId = req.params.id as string;
    const studentId = req.params.studentId as string;
    const { action, newPrice, newMessage } = req.body;

    if (userId !== studentId) { res.status(403).json({ error: 'Not authorized' }); return; }

    const bid = await prisma.bid.findUnique({ where: { bountyId_studentId: { bountyId, studentId } } });
    if (!bid) { res.status(404).json({ error: 'Bid not found' }); return; }
    if (!bid.counterOfferPrice) { res.status(400).json({ error: 'No counter offer to respond to' }); return; }

    if (action === 'ACCEPT') {
      const agreedPrice = Number(bid.counterOfferPrice);
      const bountyData = await prisma.bounty.findUnique({ where: { id: bountyId } });
      await prisma.$transaction([
        prisma.bounty.update({
          where: { id: bountyId },
          data: { status: 'IN_PROGRESS', claimedById: studentId, price: agreedPrice },
        }),
        prisma.bid.update({ where: { id: bid.id }, data: { bidPrice: agreedPrice } }),
        // Auto-create chat conversation
        prisma.chatConversation.upsert({
          where: { bountyId },
          create: { bountyId, founderId: bountyData!.founderId, juniorProId: studentId },
          update: {},
        }),
      ]);
    } else if (action === 'DECLINE') {
      await prisma.bid.update({
        where: { id: bid.id },
        data: { counterOfferPrice: null, counterOfferMessage: null },
      });
    } else if (action === 'COUNTER') {
      if (newPrice == null) { res.status(400).json({ error: 'newPrice required for counter' }); return; }
      await prisma.bid.update({
        where: { id: bid.id },
        data: { bidPrice: Number(newPrice), message: newMessage || bid.message, counterOfferPrice: null, counterOfferMessage: null },
      });
    } else {
      res.status(400).json({ error: 'action must be ACCEPT, DECLINE, or COUNTER' });
      return;
    }

    const updated = await fetchBountyFull(bountyId);
    res.json(mapBounty(updated));
  } catch (err) {
    console.error('[respondToCounter]', err);
    res.status(500).json({ error: 'Failed to respond to counter offer' });
  }
}

// ══════════════════════════════════════════════════════════════════════
// 6. POST /api/bounties/:id/bids/:studentId/poc/request
// ══════════════════════════════════════════════════════════════════════
export async function requestPoc(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const bountyId = req.params.id as string;
    const studentId = req.params.studentId as string;

    const bounty = await prisma.bounty.findUnique({ where: { id: bountyId } });
    if (!bounty) { res.status(404).json({ error: 'Bounty not found' }); return; }
    if (bounty.founderId !== userId) { res.status(403).json({ error: 'Not authorized' }); return; }

    const bid = await prisma.bid.findUnique({ where: { bountyId_studentId: { bountyId, studentId } } });
    if (!bid) { res.status(404).json({ error: 'Bid not found' }); return; }

    await prisma.bid.update({
      where: { id: bid.id },
      data: { pocRequested: true, pocStatus: 'PENDING' },
    });

    const updated = await fetchBountyFull(bountyId);
    res.json(mapBounty(updated));
  } catch (err) {
    console.error('[requestPoc]', err);
    res.status(500).json({ error: 'Failed to request POC' });
  }
}

// ══════════════════════════════════════════════════════════════════════
// 7. PUT /api/bounties/:id/bids/:studentId/poc/respond
// ══════════════════════════════════════════════════════════════════════
export async function respondToPoc(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const bountyId = req.params.id as string;
    const studentId = req.params.studentId as string;
    const { action } = req.body;

    if (userId !== studentId) { res.status(403).json({ error: 'Not authorized' }); return; }

    const bid = await prisma.bid.findUnique({ where: { bountyId_studentId: { bountyId, studentId } } });
    if (!bid) { res.status(404).json({ error: 'Bid not found' }); return; }
    if (bid.pocStatus !== 'PENDING') { res.status(400).json({ error: 'No pending POC request' }); return; }

    if (action !== 'ACCEPTED' && action !== 'DECLINED') {
      res.status(400).json({ error: 'action must be ACCEPTED or DECLINED' });
      return;
    }

    await prisma.bid.update({ where: { id: bid.id }, data: { pocStatus: action } });

    const updated = await fetchBountyFull(bountyId);
    res.json(mapBounty(updated));
  } catch (err) {
    console.error('[respondToPoc]', err);
    res.status(500).json({ error: 'Failed to respond to POC request' });
  }
}

// ══════════════════════════════════════════════════════════════════════
// 8. POST /api/bounties/:id/bids/:studentId/poc/submit
// ══════════════════════════════════════════════════════════════════════
export async function submitPoc(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const bountyId = req.params.id as string;
    const studentId = req.params.studentId as string;
    const { link, screenshotUrl } = req.body;

    if (userId !== studentId) { res.status(403).json({ error: 'Not authorized' }); return; }
    if (!link) { res.status(400).json({ error: 'link is required' }); return; }

    const bid = await prisma.bid.findUnique({ where: { bountyId_studentId: { bountyId, studentId } } });
    if (!bid) { res.status(404).json({ error: 'Bid not found' }); return; }
    if (bid.pocStatus !== 'ACCEPTED') { res.status(400).json({ error: 'POC not accepted yet' }); return; }

    await prisma.bid.update({
      where: { id: bid.id },
      data: { pocSubmissionLink: link, pocSubmissionScreenshotUrl: screenshotUrl || null, pocStatus: 'SUBMITTED' },
    });

    const updated = await fetchBountyFull(bountyId);
    res.json(mapBounty(updated));
  } catch (err) {
    console.error('[submitPoc]', err);
    res.status(500).json({ error: 'Failed to submit POC' });
  }
}

// ══════════════════════════════════════════════════════════════════════
// 9. POST /api/bounties/:id/award/:studentId
// ══════════════════════════════════════════════════════════════════════
export async function awardBid(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const bountyId = req.params.id as string;
    const studentId = req.params.studentId as string;

    const bounty = await prisma.bounty.findUnique({ where: { id: bountyId } });
    if (!bounty) { res.status(404).json({ error: 'Bounty not found' }); return; }
    if (bounty.founderId !== userId) { res.status(403).json({ error: 'Not authorized' }); return; }
    if (bounty.status !== 'BIDDING') { res.status(400).json({ error: 'Bounty is not in bidding phase' }); return; }

    const bid = await prisma.bid.findUnique({ where: { bountyId_studentId: { bountyId, studentId } } });
    if (!bid) { res.status(404).json({ error: 'Bid not found' }); return; }

    await prisma.$transaction([
      prisma.bounty.update({
        where: { id: bountyId },
        data: { status: 'IN_PROGRESS', claimedById: studentId, price: bid.bidPrice },
      }),
      // Auto-create chat conversation between founder and awarded student
      prisma.chatConversation.upsert({
        where: { bountyId },
        create: { bountyId, founderId: userId, juniorProId: studentId },
        update: {},
      }),
    ]);

    const updated = await fetchBountyFull(bountyId);
    res.json(mapBounty(updated));
  } catch (err) {
    console.error('[awardBid]', err);
    res.status(500).json({ error: 'Failed to award bid' });
  }
}

// ══════════════════════════════════════════════════════════════════════
// 10. POST /api/bounties/:id/milestones
// ══════════════════════════════════════════════════════════════════════
export async function addMilestone(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const bountyId = req.params.id as string;
    const { title, description } = req.body;

    if (!title) { res.status(400).json({ error: 'title is required' }); return; }

    const bounty = await prisma.bounty.findUnique({ where: { id: bountyId } });
    if (!bounty) { res.status(404).json({ error: 'Bounty not found' }); return; }
    if (bounty.founderId !== userId && bounty.claimedById !== userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    await prisma.milestone.create({
      data: { bountyId, title, description: description || '' },
    });

    const updated = await fetchBountyFull(bountyId);
    res.status(201).json(mapBounty(updated));
  } catch (err) {
    console.error('[addMilestone]', err);
    res.status(500).json({ error: 'Failed to add milestone' });
  }
}

// ══════════════════════════════════════════════════════════════════════
// 11. PUT /api/bounties/:id/milestones/:milestoneId
// ══════════════════════════════════════════════════════════════════════
export async function updateMilestone(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const bountyId = req.params.id as string;
    const milestoneId = req.params.milestoneId as string;
    const { status } = req.body;

    if (!status) { res.status(400).json({ error: 'status is required' }); return; }

    const bounty = await prisma.bounty.findUnique({ where: { id: bountyId } });
    if (!bounty) { res.status(404).json({ error: 'Bounty not found' }); return; }
    if (bounty.founderId !== userId && bounty.claimedById !== userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const milestone = await prisma.milestone.findFirst({ where: { id: milestoneId, bountyId } });
    if (!milestone) { res.status(404).json({ error: 'Milestone not found' }); return; }

    await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status,
        completedAt: status === 'COMPLETED' ? new Date() : (status === 'PENDING' ? null : milestone.completedAt),
      },
    });

    const updated = await fetchBountyFull(bountyId);
    res.json(mapBounty(updated));
  } catch (err) {
    console.error('[updateMilestone]', err);
    res.status(500).json({ error: 'Failed to update milestone' });
  }
}

// ══════════════════════════════════════════════════════════════════════
// 12. POST /api/bounties/:id/submit
// ══════════════════════════════════════════════════════════════════════
export async function submitProject(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const bountyId = req.params.id as string;
    const { submissionLink, screenshotUrl } = req.body;

    if (!submissionLink) { res.status(400).json({ error: 'submissionLink is required' }); return; }

    const bounty = await prisma.bounty.findUnique({ where: { id: bountyId } });
    if (!bounty) { res.status(404).json({ error: 'Bounty not found' }); return; }
    if (bounty.claimedById !== userId) { res.status(403).json({ error: 'Not authorized' }); return; }

    await prisma.bounty.update({
      where: { id: bountyId },
      data: { status: 'REVIEW', submissionLink, submissionScreenshotUrl: screenshotUrl || null },
    });

    const updated = await fetchBountyFull(bountyId);
    res.json(mapBounty(updated));
  } catch (err) {
    console.error('[submitProject]', err);
    res.status(500).json({ error: 'Failed to submit project' });
  }
}

// ══════════════════════════════════════════════════════════════════════
// 13. POST /api/bounties/:id/resubmit
// ══════════════════════════════════════════════════════════════════════
export async function resubmitProject(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const bountyId = req.params.id as string;
    const { message, submissionLink, screenshotUrl } = req.body;

    const bounty = await prisma.bounty.findUnique({ where: { id: bountyId } });
    if (!bounty) { res.status(404).json({ error: 'Bounty not found' }); return; }
    if (bounty.claimedById !== userId) { res.status(403).json({ error: 'Not authorized' }); return; }

    await prisma.$transaction([
      prisma.bountyFeedback.create({
        data: { bountyId, senderId: userId, message: message || '', screenshotUrl: screenshotUrl || null },
      }),
      prisma.bounty.update({
        where: { id: bountyId },
        data: {
          status: 'REVIEW',
          submissionLink: submissionLink || bounty.submissionLink,
          submissionScreenshotUrl: screenshotUrl || bounty.submissionScreenshotUrl,
        },
      }),
    ]);

    const updated = await fetchBountyFull(bountyId);
    res.json(mapBounty(updated));
  } catch (err) {
    console.error('[resubmitProject]', err);
    res.status(500).json({ error: 'Failed to resubmit project' });
  }
}

// ══════════════════════════════════════════════════════════════════════
// 14. POST /api/bounties/:id/revision
// ══════════════════════════════════════════════════════════════════════
export async function requestRevision(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const bountyId = req.params.id as string;
    const { message, screenshotUrl } = req.body;

    if (!message) { res.status(400).json({ error: 'message is required' }); return; }

    const bounty = await prisma.bounty.findUnique({ where: { id: bountyId } });
    if (!bounty) { res.status(404).json({ error: 'Bounty not found' }); return; }
    if (bounty.founderId !== userId) { res.status(403).json({ error: 'Not authorized' }); return; }

    await prisma.$transaction([
      prisma.bountyFeedback.create({
        data: { bountyId, senderId: userId, message, screenshotUrl: screenshotUrl || null },
      }),
      prisma.bounty.update({ where: { id: bountyId }, data: { status: 'REVISION_REQUESTED' } }),
    ]);

    const updated = await fetchBountyFull(bountyId);
    res.json(mapBounty(updated));
  } catch (err) {
    console.error('[requestRevision]', err);
    res.status(500).json({ error: 'Failed to request revision' });
  }
}

// ══════════════════════════════════════════════════════════════════════
// 15. POST /api/bounties/:id/approve
// ══════════════════════════════════════════════════════════════════════
export async function approveSubmission(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const bountyId = req.params.id as string;

    const bounty = await prisma.bounty.findUnique({ where: { id: bountyId } });
    if (!bounty) { res.status(404).json({ error: 'Bounty not found' }); return; }
    if (bounty.founderId !== userId) { res.status(403).json({ error: 'Not authorized' }); return; }

    await prisma.bounty.update({ where: { id: bountyId }, data: { status: 'COMPLETED' } });

    const updated = await fetchBountyFull(bountyId);
    res.json(mapBounty(updated));
  } catch (err) {
    console.error('[approveSubmission]', err);
    res.status(500).json({ error: 'Failed to approve submission' });
  }
}

// ══════════════════════════════════════════════════════════════════════
// 16. POST /api/bounties/:id/review
// ══════════════════════════════════════════════════════════════════════
export async function leaveReview(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const bountyId = req.params.id as string;
    const { rating, comment, screenshotUrl } = req.body;

    if (rating == null) { res.status(400).json({ error: 'rating is required' }); return; }

    const bounty = await prisma.bounty.findUnique({ where: { id: bountyId } });
    if (!bounty) { res.status(404).json({ error: 'Bounty not found' }); return; }
    if (bounty.founderId !== userId) { res.status(403).json({ error: 'Not authorized' }); return; }
    if (bounty.status !== 'COMPLETED') { res.status(400).json({ error: 'Bounty must be completed to leave a review' }); return; }

    // Check if review already exists
    const existingReview = await prisma.bountyFeedback.findFirst({
      where: { bountyId, rating: { not: null } },
    });
    if (existingReview) { res.status(400).json({ error: 'Review already exists' }); return; }

    await prisma.bountyFeedback.create({
      data: {
        bountyId,
        senderId: userId,
        message: comment || '',
        screenshotUrl: screenshotUrl || null,
        rating: Number(rating),
      },
    });

    const updated = await fetchBountyFull(bountyId);
    res.json(mapBounty(updated));
  } catch (err) {
    console.error('[leaveReview]', err);
    res.status(500).json({ error: 'Failed to leave review' });
  }
}

// ══════════════════════════════════════════════════════════════════════
// 17. DELETE /api/bounties/:id
// ══════════════════════════════════════════════════════════════════════
export async function deleteBounty(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const bountyId = req.params.id as string;

    const bounty = await prisma.bounty.findUnique({ where: { id: bountyId } });
    if (!bounty) { res.status(404).json({ error: 'Bounty not found' }); return; }
    if (bounty.founderId !== userId) { res.status(403).json({ error: 'Not authorized' }); return; }
    if (bounty.status !== 'OPEN' && bounty.status !== 'BIDDING') {
      res.status(400).json({ error: 'Cannot delete a bounty that has already been awarded' });
      return;
    }

    // Delete related bids, milestones, feedbacks first, then the bounty
    await prisma.$transaction([
      prisma.bid.deleteMany({ where: { bountyId } }),
      prisma.milestone.deleteMany({ where: { bountyId } }),
      prisma.bountyFeedback.deleteMany({ where: { bountyId } }),
      prisma.bounty.delete({ where: { id: bountyId } }),
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error('[deleteBounty]', err);
    res.status(500).json({ error: 'Failed to delete bounty' });
  }
}
