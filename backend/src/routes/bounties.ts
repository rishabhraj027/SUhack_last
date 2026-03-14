import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getBounties,
  createBounty,
  deleteBounty,
  placeBid,
  founderCounter,
  respondToCounter,
  requestPoc,
  respondToPoc,
  submitPoc,
  awardBid,
  addMilestone,
  updateMilestone,
  submitProject,
  resubmitProject,
  requestRevision,
  approveSubmission,
  leaveReview,
} from '../controllers/bountyController.js';

const router = Router();

// Bounty CRUD
router.get('/', authenticate, getBounties);
router.post('/', authenticate, createBounty);
router.delete('/:id', authenticate, deleteBounty);

// Bidding
router.post('/:id/bids', authenticate, placeBid);
router.post('/:id/bids/:studentId/counter', authenticate, founderCounter);
router.put('/:id/bids/:studentId/respond', authenticate, respondToCounter);

// POC
router.post('/:id/bids/:studentId/poc/request', authenticate, requestPoc);
router.put('/:id/bids/:studentId/poc/respond', authenticate, respondToPoc);
router.post('/:id/bids/:studentId/poc/submit', authenticate, submitPoc);

// Award
router.post('/:id/award/:studentId', authenticate, awardBid);

// Milestones
router.post('/:id/milestones', authenticate, addMilestone);
router.put('/:id/milestones/:milestoneId', authenticate, updateMilestone);

// Submission & Review
router.post('/:id/submit', authenticate, submitProject);
router.post('/:id/resubmit', authenticate, resubmitProject);
router.post('/:id/revision', authenticate, requestRevision);
router.post('/:id/approve', authenticate, approveSubmission);
router.post('/:id/review', authenticate, leaveReview);

export default router;
