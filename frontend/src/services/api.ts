import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ===================== TYPES =====================

export interface User {
    id: string;
    email?: string;
    role: "Business" | "JuniorPro";
    name: string;
    bio?: string;
    walletBalance: number;
    score?: number;
    skills?: string[];
    bannerColor?: string;
    avatarUrl?: string;
    cin?: string;
    gstin?: string;
    yearEstablished?: string;
    industry?: string;
    website?: string;
    officialEmail?: string;
    contactPhone?: string;
    address?: string;
    companyDescription?: string;
    portfolioUrl?: string;
}

export interface B2BCatalogItem {
    id: string;
    itemName: string;
    bulkQuantity: string;
    pricePerUnit: number;
    status: "IN_STOCK" | "OUT_OF_STOCK";
}

export interface MarketplaceListing {
    id: string;
    sellerId?: string;
    itemName: string;
    description: string;
    category: "Textiles" | "Electronics" | "Agriculture" | "Chemicals" | "Metals" | "Packaging" | "Food & Beverage" | "Other";
    bulkQuantity: string;
    pricePerUnit: number;
    minOrderQty: string;
    location: string;
    sellerName: string;
    sellerContact: {
        phone: string;
        email: string;
    };
    status: "ACTIVE" | "SOLD_OUT" | "PAUSED";
    createdAt: string;
    isOwn?: boolean;
}

export type CounterOfferStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "COUNTERED";

export interface CounterOffer {
    id: string;
    listingId: string;
    listingItemName: string;
    fromBuyer: string;
    fromBuyerName?: string;
    toSeller: string;
    toSellerName?: string;
    originalPrice: number;
    offerPrice: number;
    quantity: string;
    message: string;
    status: CounterOfferStatus;
    createdAt: string;
    counterResponse?: {
        price: number;
        message: string;
        createdAt: string;
    };
    hasReview?: boolean;
}

export interface BountyBid {
    studentId: string;
    studentName?: string;
    studentAvatarUrl?: string;
    score: number;
    bidPrice: number;
    message?: string;
    counterOfferPrice?: number;
    counterOfferMessage?: string;
    pocRequested?: boolean;
    pocStatus?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'SUBMITTED';
    pocSubmissionLink?: string;
    pocSubmissionScreenshotUrl?: string;
}

export interface MockStudentProfile {
    id: string;
    name: string;
    avatarUrl: string;
    bio: string;
    skills: string[];
    rating: number;
    scores: {
        reliability: number;
        communication: number;
        technical: number;
        creativity: number;
    };
    stats: {
        deadlineAdherence: number;
        revisionRate: number;
        clientSatisfaction: number;
        missionsCompleted: number;
        avgResponseTime: string;
    };
    portfolioUrl?: string;
}

export const getStudentProfileSync = (studentId: string): MockStudentProfile => {
    let numId = 0;
    for (let i = 0; i < studentId.length; i++) {
        numId += studentId.charCodeAt(i);
    }

    const names = ["Alex Rivera", "Sam Chen", "Jordan Taylor", "Casey Smith", "Taylor Swift", "Jamie Doe", "Chris Evans"];
    const skillsList = [
        ["React", "Node.js", "TypeScript"],
        ["Figma", "UI/UX", "Illustration"],
        ["SEO", "Content Writing", "Copywriting"],
        ["Python", "Django", "PostgreSQL"],
        ["Video Editing", "After Effects", "Premiere Pro", "CapCut"]
    ];

    return {
        id: studentId,
        name: names[numId % names.length],
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${studentId}`,
        bio: `I am a passionate junior professional eager to help businesses grow. I have successfully completed multiple bounties and maintain a high standard of work.`,
        skills: skillsList[numId % skillsList.length],
        rating: parseFloat((4.0 + ((numId % 10) / 10)).toFixed(1)),
        scores: {
            reliability: 90 + (numId % 10),
            communication: 85 + (numId % 15),
            technical: 80 + (numId % 20),
            creativity: 88 + (numId % 12),
        },
        stats: {
            deadlineAdherence: 90 + (numId % 11),
            revisionRate: 5 + (numId % 15),
            clientSatisfaction: parseFloat((4.5 + ((numId % 5) / 10)).toFixed(1)),
            missionsCompleted: 5 + (numId % 30),
            avgResponseTime: `${1 + (numId % 4)}.${numId % 10}h`
        },
        portfolioUrl: `https://github.com/${names[numId % names.length].split(' ')[0].toLowerCase()}-portfolio`
    };
};

export interface MockSellerProfile {
    sellerName: string;
    avatarUrl: string;
    bio: string;
    industry: string;
    location: string;
    rating: number;
    memberSince: string;
    scores: {
        reliability: number;
        responseTime: number;
        productQuality: number;
        negotiability: number;
    };
    stats: {
        onTimeDeliveries: number;
        totalDealsCompleted: number;
        repeatBuyerRate: number;
        avgResponseTime: string;
        disputeRate: number;
        totalRevenue: string;
    };
    certifications: string[];
}

export const getSellerProfileSync = (sellerName: string): MockSellerProfile => {
    let numId = 0;
    for (let i = 0; i < sellerName.length; i++) {
        numId += sellerName.charCodeAt(i);
    }

    const industries = ["Manufacturing", "Agriculture", "Electronics", "Textiles", "Chemicals", "Food Processing", "Logistics"];
    const locations = ["Mumbai, Maharashtra", "Bengaluru, Karnataka", "Kochi, Kerala", "Ahmedabad, Gujarat", "Pune, Maharashtra", "Chennai, Tamil Nadu", "Jaipur, Rajasthan"];
    const certsList = [
        ["ISO 9001", "ISO 14001"],
        ["FSSAI Certified", "Organic India"],
        ["BIS Certified", "CE Marking"],
        ["MSME Registered", "GST Verified"],
        ["ISO 22000", "HACCP"],
    ];
    const bios = [
        "Trusted B2B supplier with years of experience in bulk material supply. We pride ourselves on consistent quality and timely deliveries.",
        "Leading manufacturer and distributor specializing in high-quality products for businesses across India. Known for competitive pricing and reliability.",
        "Established business with a strong track record of customer satisfaction. We offer flexible bulk pricing and dedicated account management.",
    ];

    const yearsAgo = 2 + (numId % 8);
    const memberYear = new Date().getFullYear() - yearsAgo;

    return {
        sellerName,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(sellerName)}&backgroundColor=356DDA`,
        bio: bios[numId % bios.length],
        industry: industries[numId % industries.length],
        location: locations[numId % locations.length],
        rating: parseFloat((4.0 + ((numId % 10) / 10)).toFixed(1)),
        memberSince: `${memberYear}`,
        scores: {
            reliability: 85 + (numId % 15),
            responseTime: 80 + (numId % 20),
            productQuality: 88 + (numId % 12),
            negotiability: 75 + (numId % 25),
        },
        stats: {
            onTimeDeliveries: 88 + (numId % 12),
            totalDealsCompleted: 15 + (numId % 150),
            repeatBuyerRate: 60 + (numId % 35),
            avgResponseTime: `${1 + (numId % 6)}h`,
            disputeRate: parseFloat((0.5 + ((numId % 5) * 0.3)).toFixed(1)),
            totalRevenue: `₹${((numId % 50) + 10).toFixed(0)}L+`,
        },
        certifications: certsList[numId % certsList.length],
    };
};

export interface FeedbackItem {
    id: string;
    sender: 'founder' | 'student';
    message: string;
    screenshotUrl?: string;
    timestamp: string;
}

export interface FounderReview {
    rating: number;
    comment: string;
    timestamp: string;
    screenshotUrl?: string;
}

export interface Milestone {
    id: string;
    title: string;
    description?: string;
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
    createdAt: string;
    completedAt?: string;
}

export interface Bounty {
    id: string;
    title: string;
    description: string;
    founderId?: string;
    founderName?: string;
    founderAvatarUrl?: string;
    category?: "Design" | "Development" | "Writing" | "Social Media" | "Video/Animation" | "Marketing" | "Miscellaneous";
    price: number;
    deadline?: string;
    status: "OPEN" | "BIDDING" | "IN_PROGRESS" | "REVIEW" | "REVISION_REQUESTED" | "COMPLETED";
    bids: BountyBid[];
    feedbackHistory: FeedbackItem[];
    submissionLink?: string;
    submissionScreenshotUrl?: string;
    review?: FounderReview;
    posted_by?: string;
    claimed_by?: string;
    applicants?: string[];
    tags?: string[];
    milestones?: Milestone[];
}

export type CreateBountyPayload = {
    title: string;
    description: string;
    price: number;
    deadline: string;
    tags?: string[];
};

export function formatTimeRemaining(deadline?: string): string {
    if (!deadline) return '—';
    const now = new Date();
    const end = new Date(deadline);
    const diffMs = end.getTime() - now.getTime();
    if (diffMs <= 0) return 'Overdue';
    const totalMins = Math.floor(diffMs / 60000);
    const totalHours = Math.floor(totalMins / 60);
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    if (days > 0) return `${days}D ${hours}H`;
    if (totalHours > 0) return `${totalHours}H`;
    return `${totalMins}M`;
}

export interface SocialReply {
    id: string;
    authorId?: string;
    authorName: string;
    authorAvatarUrl?: string;
    authorRole?: string;
    content: string;
    likes: number;
    createdAt: string;
}

export interface SocialFeedPost {
    id: string;
    authorId?: string;
    authorName: string;
    authorAvatarUrl?: string;
    authorRole?: string;
    content: string;
    tags: string[];
    createdAt: string;
    likes: number;
    liked?: boolean;
    replies: SocialReply[];
}

export interface TrendingTag {
    tag: string;
    count: number;
}

export interface ChatMessage {
    id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    senderRole: "Business" | "JuniorPro";
    content: string;
    imageUrl?: string;
    timestamp: string;
}

export interface ChatConversation {
    id: string;
    bountyId: string;
    bountyTitle: string;
    founderId: string;
    founderName: string;
    founderAvatarUrl?: string;
    juniorProId: string;
    juniorProName: string;
    juniorProAvatarUrl?: string;
    lastMessage?: string;
    lastMessageTime?: string;
    unreadCount: number;
}


// ===================== REAL BACKEND — AUTH & USER =====================

function mapBackendUser(u: any): User {
    return {
        id: u.id,
        email: u.email,
        role: u.role,
        name: u.name,
        bio: u.bio || undefined,
        walletBalance: Number(u.walletBalance) || 0,
        score: Number(u.score) || 0,
        skills: u.skills || [],
        bannerColor: u.bannerColor || undefined,
        avatarUrl: u.avatarUrl || undefined,
        cin: u.cin || undefined,
        gstin: u.gstin || undefined,
        yearEstablished: u.yearEstablished || undefined,
        industry: u.industry || undefined,
        website: u.website || undefined,
        officialEmail: u.officialEmail || undefined,
        contactPhone: u.contactPhone || undefined,
        address: u.address || undefined,
        companyDescription: u.companyDescription || undefined,
        portfolioUrl: u.portfolioUrl || undefined,
    };
}

export const loginWithEmail = async (email: string, password: string): Promise<{ token: string; user: User }> => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    return { token, user: mapBackendUser(user) };
};

export const registerWithEmail = async (name: string, email: string, password: string, role: "Business" | "JuniorPro"): Promise<{ token: string; user: User }> => {
    const res = await api.post('/auth/register', { name, email, password, role });
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    return { token, user: mapBackendUser(user) };
};

export const handleGoogleOAuth = async (role: "Business" | "JuniorPro"): Promise<User> => {
    // Redirect to backend Google OAuth init endpoint
    window.location.href = `${API_URL}/auth/google/init?role=${role}`;
    // This never resolves — the browser navigates away
    return new Promise(() => {});
};

export const updateUserProfile = async (_userId: string, updates: Partial<User>): Promise<User> => {
    const res = await api.put('/users/me', updates);
    const user = mapBackendUser(res.data.user);
    localStorage.setItem('user', JSON.stringify(user));
    return user;
};

export const fetchUserById = async (userId: string): Promise<User> => {
    const res = await api.get(`/users?ids=${userId}`);
    const users = res.data.users;
    if (users && users.length > 0) return mapBackendUser(users[0]);
    throw new Error('User not found');
};

export const fetchUsersByIds = async (ids: string[]): Promise<User[]> => {
    const validIds = ids.filter(id => id && id.trim().length > 0);
    if (!validIds.length) return [];
    const res = await api.get(`/users?ids=${validIds.join(',')}`);
    return (res.data.users || []).map(mapBackendUser);
};


// ===================== MOCK — REMAINING SERVICES (will be replaced with backend) =====================

// ===================== REAL BACKEND — CATALOG =====================

export const fetchBusinessCatalog = async (): Promise<B2BCatalogItem[]> => {
    const res = await api.get('/catalog');
    return res.data;
};

export const postNewInventory = async (data: Omit<B2BCatalogItem, "id">): Promise<B2BCatalogItem> => {
    const res = await api.post('/catalog', data);
    return res.data;
};

// ===================== REAL BACKEND — BOUNTIES =====================

export const fetchBounties = async (): Promise<Bounty[]> => {
    const res = await api.get('/bounties');
    return res.data;
};

export const postBounty = async (bountyData: CreateBountyPayload): Promise<Bounty> => {
    const res = await api.post('/bounties', bountyData);
    return res.data;
};

export const claimBounty = async (id: string, bidData: { bidPrice: number; message?: string }): Promise<Bounty> => {
    const res = await api.post(`/bounties/${id}/bids`, bidData);
    return res.data;
};

export const submitProject = async (id: string, submissionLink: string, screenshotUrl?: string): Promise<Bounty> => {
    const res = await api.post(`/bounties/${id}/submit`, { submissionLink, screenshotUrl });
    return res.data;
};

export const founderCounterBid = async (bountyId: string, studentId: string, price: number, message: string): Promise<Bounty> => {
    const res = await api.post(`/bounties/${bountyId}/bids/${studentId}/counter`, { price, message });
    return res.data;
};

export const respondToFounderCounter = async (bountyId: string, studentId: string, action: 'ACCEPT' | 'DECLINE' | 'COUNTER', newPrice?: number, newMessage?: string): Promise<Bounty> => {
    const res = await api.put(`/bounties/${bountyId}/bids/${studentId}/respond`, { action, newPrice, newMessage });
    return res.data;
};

export const requestPocFromStudent = async (bountyId: string, studentId: string): Promise<Bounty> => {
    const res = await api.post(`/bounties/${bountyId}/bids/${studentId}/poc/request`);
    return res.data;
};

export const respondToPocRequest = async (bountyId: string, studentId: string, action: 'ACCEPTED' | 'DECLINED'): Promise<Bounty> => {
    const res = await api.put(`/bounties/${bountyId}/bids/${studentId}/poc/respond`, { action });
    return res.data;
};

export const submitPocWork = async (bountyId: string, studentId: string, link: string, screenshotUrl?: string): Promise<Bounty> => {
    const res = await api.post(`/bounties/${bountyId}/bids/${studentId}/poc/submit`, { link, screenshotUrl });
    return res.data;
};

export const awardBidToStudent = async (bountyId: string, studentId: string): Promise<Bounty> => {
    const res = await api.post(`/bounties/${bountyId}/award/${studentId}`);
    return res.data;
};

export const addBountyMilestone = async (bountyId: string, title: string, description?: string): Promise<Bounty> => {
    const res = await api.post(`/bounties/${bountyId}/milestones`, { title, description });
    return res.data;
};

export const updateBountyMilestone = async (bountyId: string, milestoneId: string, status: string): Promise<Bounty> => {
    const res = await api.put(`/bounties/${bountyId}/milestones/${milestoneId}`, { status });
    return res.data;
};

export const resubmitBountyProject = async (bountyId: string, message: string, submissionLink: string, screenshotUrl?: string): Promise<Bounty> => {
    const res = await api.post(`/bounties/${bountyId}/resubmit`, { message, submissionLink, screenshotUrl });
    return res.data;
};

export const requestBountyRevision = async (bountyId: string, message: string, screenshotUrl?: string): Promise<Bounty> => {
    const res = await api.post(`/bounties/${bountyId}/revision`, { message, screenshotUrl });
    return res.data;
};

export const approveBountySubmission = async (bountyId: string): Promise<Bounty> => {
    const res = await api.post(`/bounties/${bountyId}/approve`);
    return res.data;
};

export const leaveBountyReview = async (bountyId: string, rating: number, comment: string, screenshotUrl?: string): Promise<Bounty> => {
    const res = await api.post(`/bounties/${bountyId}/review`, { rating, comment, screenshotUrl });
    return res.data;
};

export const deleteBountyById = async (bountyId: string): Promise<{ success: boolean }> => {
    const res = await api.delete(`/bounties/${bountyId}`);
    return res.data;
};

// --- Social Feed (Real Backend) ---

export const fetchNetworkFeed = async (tag?: string): Promise<SocialFeedPost[]> => {
    const params = tag ? `?tag=${encodeURIComponent(tag)}` : '';
    const res = await api.get(`/feed${params}`);
    return res.data;
};

export const fetchTrendingTags = async (): Promise<TrendingTag[]> => {
    const res = await api.get('/feed/trending');
    return res.data;
};

export const postInsight = async (data: { authorName: string; content: string; tags: string[] }): Promise<SocialFeedPost> => {
    const res = await api.post('/feed', { content: data.content, tags: data.tags });
    return res.data;
};

export const likeInsight = async (postId: string): Promise<{ liked: boolean; likes: number }> => {
    const res = await api.post(`/feed/${postId}/like`);
    return res.data;
};

export const replyToInsight = async (postId: string, content: string): Promise<SocialReply> => {
    const res = await api.post(`/feed/${postId}/replies`, { content });
    return res.data;
};

export const deletePost = async (postId: string): Promise<void> => {
    await api.delete(`/feed/${postId}`);
};

export const deleteReply = async (postId: string, replyId: string): Promise<void> => {
    await api.delete(`/feed/${postId}/replies/${replyId}`);
};

// ===================== REAL BACKEND — MARKETPLACE =====================

export const fetchMarketplaceListings = async (): Promise<MarketplaceListing[]> => {
    const res = await api.get('/marketplace');
    return res.data;
};

export const postMarketplaceListing = async (data: Omit<MarketplaceListing, "id" | "createdAt">): Promise<MarketplaceListing> => {
    const res = await api.post('/marketplace', data);
    return res.data;
};

export const deleteMarketplaceListing = async (id: string): Promise<{ success: boolean }> => {
    const res = await api.delete(`/marketplace/${id}`);
    return res.data;
};

// ===================== REAL BACKEND — NEGOTIATIONS =====================

export const fetchNegotiations = async (): Promise<CounterOffer[]> => {
    const res = await api.get('/negotiations');
    return res.data;
};

export const submitCounterOffer = async (data: Omit<CounterOffer, "id" | "createdAt" | "status">): Promise<CounterOffer> => {
    const res = await api.post('/negotiations', data);
    return res.data;
};

export const respondToCounterOffer = async (offerId: string, action: "ACCEPTED" | "REJECTED", counterPrice?: number, counterMessage?: string): Promise<CounterOffer> => {
    const res = await api.put(`/negotiations/${offerId}/respond`, { action, counterPrice, counterMessage });
    return res.data;
};

// --- Reviews & Company Profiles (Real) ---

export interface ReviewData {
    id: string;
    negotiationId?: string;
    bountyId?: string;
    reviewerId?: string;
    reviewerName?: string;
    rating: number;
    deliveredOnTime?: boolean;
    comment: string;
    createdAt: string;
}

export interface CompanyProfileStats {
    reliabilityScore: number;
    avgRating: number;
    onTimePercent: number;
    totalDeals: number;
    totalReviews: number;
    // JuniorPro-specific
    deadlineAdherence?: number;
    totalMissions?: number;
    revisionRate?: number;
}

export interface CompletedProject {
    id: string;
    title: string;
    category: string;
    price: number;
    completedAt: string;
    founderName: string;
    founderAvatarUrl?: string;
    rating: number | null;
    reviewComment: string | null;
    milestones: { id: string; title: string; status: string }[];
}

export interface CompanyProfile {
    user: {
        id: string;
        name: string;
        role?: string;
        avatarUrl?: string;
        bio?: string;
        skills?: string[];
        portfolioUrl?: string;
        bannerColor?: string;
        industry?: string;
        address?: string;
        companyDescription?: string;
        yearEstablished?: string;
        gstin?: string;
        website?: string;
        officialEmail?: string;
        score?: number;
        rating: number;
        createdAt: string;
    };
    reviews: ReviewData[];
    completedProjects?: CompletedProject[];
    stats: CompanyProfileStats;
}

export const fetchCompanyProfile = async (userId: string): Promise<CompanyProfile> => {
    const res = await api.get(`/users/${userId}/profile`);
    return res.data;
};

export const createReviewForSeller = async (data: { negotiationId: string; rating: number; deliveredOnTime: boolean; comment: string }): Promise<ReviewData> => {
    const res = await api.post('/reviews', data);
    return res.data;
};

export const fetchReviewsForUser = async (userId: string): Promise<ReviewData[]> => {
    const res = await api.get(`/reviews/user/${userId}`);
    return res.data;
};
export const fetchChatConversations = async (): Promise<ChatConversation[]> => {
    const res = await api.get('/chats');
    return res.data;
};

export const fetchChatMessages = async (conversationId: string): Promise<ChatMessage[]> => {
    const res = await api.get(`/chats/${conversationId}/messages`);
    return res.data;
};

export const sendChatMessage = async (
    conversationId: string,
    content: string,
    _senderId: string,
    _senderName: string,
    _senderRole: "Business" | "JuniorPro",
    imageUrl?: string
): Promise<ChatMessage> => {
    const res = await api.post(`/chats/${conversationId}/messages`, { content, imageUrl });
    return res.data;
};

// ===================== REAL BACKEND — UPLOAD (S3) =====================
export const uploadFile = async (file: File, type: 'avatar' | 'submission' | 'screenshot' | 'image' = 'image'): Promise<string> => {
    const folderMap: Record<string, string> = { avatar: 'avatars', submission: 'submissions', screenshot: 'screenshots', image: 'uploads' };
    const folder = folderMap[type] || 'uploads';
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(`/upload?folder=${folder}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.url;
};
