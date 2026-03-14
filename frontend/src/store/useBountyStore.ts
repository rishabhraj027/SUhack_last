import { create } from 'zustand';
import {
    fetchBounties, postBounty, claimBounty, submitProject,
    founderCounterBid, respondToFounderCounter,
    requestPocFromStudent, respondToPocRequest, submitPocWork,
    awardBidToStudent, addBountyMilestone, updateBountyMilestone,
    resubmitBountyProject, requestBountyRevision,
    approveBountySubmission, leaveBountyReview, deleteBountyById,
} from '../services/api';
import type { Bounty, CreateBountyPayload, Milestone } from '../services/api';

interface BountyState {
    bounties: Bounty[];
    isLoading: boolean;
    error: string | null;
    loadBounties: () => Promise<void>;
    createNewBounty: (bounty: CreateBountyPayload) => Promise<void>;
    placeBid: (id: string, bid: { bidPrice: number; message?: string }) => Promise<void>;
    submitWork: (id: string, s3Url: string, screenshotUrl?: string) => Promise<void>;
    respondToCounterOffer: (id: string, action: 'ACCEPT' | 'DECLINE' | 'COUNTER', studentId: string, newPrice?: number, newMessage?: string) => Promise<void>;
    requestRevision: (bountyId: string, message: string, screenshotUrl?: string) => Promise<void>;
    approveSubmission: (bountyId: string) => Promise<void>;
    resubmitWork: (bountyId: string, message: string, link: string, screenshotUrl?: string) => Promise<void>;
    leaveReview: (bountyId: string, rating: number, comment: string, screenshotUrl?: string) => Promise<void>;
    awardBid: (bountyId: string, studentId: string) => Promise<void>;
    founderCounterOffer: (bountyId: string, studentId: string, newPrice: number, message: string) => Promise<void>;
    requestPoc: (bountyId: string, studentId: string) => Promise<void>;
    respondToPoc: (bountyId: string, studentId: string, action: 'ACCEPT' | 'DECLINE') => Promise<void>;
    submitPoc: (bountyId: string, studentId: string, link: string, screenshotUrl?: string) => Promise<void>;
    addMilestone: (bountyId: string, title: string, description?: string) => Promise<void>;
    updateMilestoneStatus: (bountyId: string, milestoneId: string, status: Milestone['status']) => Promise<void>;
    deleteBounty: (bountyId: string) => Promise<void>;
}

// Helper: replace a bounty in the list with an updated one from the API
function replaceBounty(bounties: Bounty[], updated: Bounty): Bounty[] {
    return bounties.map(b => b.id === updated.id ? updated : b);
}

export const useBountyStore = create<BountyState>()((set) => ({
    bounties: [],
    isLoading: false,
    error: null,

    loadBounties: async () => {
        set({ isLoading: true, error: null });
        try {
            const data = await fetchBounties();
            set({ bounties: data, isLoading: false });
        } catch (err: unknown) {
            set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
        }
    },

    createNewBounty: async (bounty) => {
        set({ isLoading: true, error: null });
        try {
            const newBounty = await postBounty(bounty);
            set((state) => ({ bounties: [newBounty, ...state.bounties], isLoading: false }));
        } catch (err: unknown) {
            set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
        }
    },

    placeBid: async (id, bid) => {
        set({ isLoading: true, error: null });
        try {
            const updated = await claimBounty(id, bid);
            set((state) => ({ bounties: replaceBounty(state.bounties, updated), isLoading: false }));
        } catch (err: unknown) {
            set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
        }
    },

    submitWork: async (id, s3Url, screenshotUrl?) => {
        set({ isLoading: true, error: null });
        try {
            const updated = await submitProject(id, s3Url, screenshotUrl);
            set((state) => ({ bounties: replaceBounty(state.bounties, updated), isLoading: false }));
        } catch (err: unknown) {
            set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
        }
    },

    respondToCounterOffer: async (id, action, studentId, newPrice?, newMessage?) => {
        set({ isLoading: true, error: null });
        try {
            const updated = await respondToFounderCounter(id, studentId, action, newPrice, newMessage);
            set((state) => ({ bounties: replaceBounty(state.bounties, updated), isLoading: false }));
        } catch (err: unknown) {
            set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
        }
    },

    requestRevision: async (bountyId, message, screenshotUrl?) => {
        set({ isLoading: true, error: null });
        try {
            const updated = await requestBountyRevision(bountyId, message, screenshotUrl);
            set((state) => ({ bounties: replaceBounty(state.bounties, updated), isLoading: false }));
        } catch (err: unknown) {
            set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
        }
    },

    approveSubmission: async (bountyId) => {
        set({ isLoading: true, error: null });
        try {
            const updated = await approveBountySubmission(bountyId);
            set((state) => ({ bounties: replaceBounty(state.bounties, updated), isLoading: false }));
        } catch (err: unknown) {
            set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
        }
    },

    resubmitWork: async (bountyId, message, link, screenshotUrl?) => {
        set({ isLoading: true, error: null });
        try {
            const updated = await resubmitBountyProject(bountyId, message, link, screenshotUrl);
            set((state) => ({ bounties: replaceBounty(state.bounties, updated), isLoading: false }));
        } catch (err: unknown) {
            set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
        }
    },

    leaveReview: async (bountyId, rating, comment, screenshotUrl?) => {
        set({ isLoading: true, error: null });
        try {
            const updated = await leaveBountyReview(bountyId, rating, comment, screenshotUrl);
            set((state) => ({ bounties: replaceBounty(state.bounties, updated), isLoading: false }));
        } catch (err: unknown) {
            set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
        }
    },

    awardBid: async (bountyId, studentId) => {
        set({ isLoading: true, error: null });
        try {
            const updated = await awardBidToStudent(bountyId, studentId);
            set((state) => ({ bounties: replaceBounty(state.bounties, updated), isLoading: false }));
        } catch (err: unknown) {
            set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
        }
    },

    founderCounterOffer: async (bountyId, studentId, newPrice, message) => {
        set({ isLoading: true, error: null });
        try {
            const updated = await founderCounterBid(bountyId, studentId, newPrice, message);
            set((state) => ({ bounties: replaceBounty(state.bounties, updated), isLoading: false }));
        } catch (err: unknown) {
            set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
        }
    },

    requestPoc: async (bountyId, studentId) => {
        set({ isLoading: true, error: null });
        try {
            const updated = await requestPocFromStudent(bountyId, studentId);
            set((state) => ({ bounties: replaceBounty(state.bounties, updated), isLoading: false }));
        } catch (err: unknown) {
            set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
        }
    },

    respondToPoc: async (bountyId, studentId, action) => {
        set({ isLoading: true, error: null });
        try {
            const pocAction = action === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED';
            const updated = await respondToPocRequest(bountyId, studentId, pocAction);
            set((state) => ({ bounties: replaceBounty(state.bounties, updated), isLoading: false }));
        } catch (err: unknown) {
            set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
        }
    },

    submitPoc: async (bountyId, studentId, link, screenshotUrl?) => {
        set({ isLoading: true, error: null });
        try {
            const updated = await submitPocWork(bountyId, studentId, link, screenshotUrl);
            set((state) => ({ bounties: replaceBounty(state.bounties, updated), isLoading: false }));
        } catch (err: unknown) {
            set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
        }
    },

    addMilestone: async (bountyId, title, description?) => {
        set({ isLoading: true, error: null });
        try {
            const updated = await addBountyMilestone(bountyId, title, description);
            set((state) => ({ bounties: replaceBounty(state.bounties, updated), isLoading: false }));
        } catch (err: unknown) {
            set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
        }
    },

    updateMilestoneStatus: async (bountyId, milestoneId, status) => {
        set({ isLoading: true, error: null });
        try {
            const updated = await updateBountyMilestone(bountyId, milestoneId, status);
            set((state) => ({ bounties: replaceBounty(state.bounties, updated), isLoading: false }));
        } catch (err: unknown) {
            set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
        }
    },

    deleteBounty: async (bountyId) => {
        set({ isLoading: true, error: null });
        try {
            await deleteBountyById(bountyId);
            set((state) => ({ bounties: state.bounties.filter(b => b.id !== bountyId), isLoading: false }));
        } catch (err: unknown) {
            set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
        }
    },
}));
