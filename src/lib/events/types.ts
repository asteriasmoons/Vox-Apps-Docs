export type LureliaEventCounts = {
  going?: number;
  interested?: number;
  declined?: number;
  pending?: number;
  attendees?: number;
  comments?: number;
  posts?: number;
};

export type LureliaSharedEvent = {
  _id: string;
  localID?: string;
  title: string;
  description?: string;
  iconName?: string;
  colorHex?: string;
  timezoneIdentifier?: string;
  startDate: string;
  endDate?: string | null;
  isAllDay?: boolean;
  locationName?: string;
  address?: string;
  visibility?: "private" | "link" | "public";
  inviteToken?: string;
  shareCode?: string;
  hostUserID?: string;
  hostDisplayName?: string;
  hostAvatarURL?: string;
  cancelledAt?: string | null;
  registrationClosed?: boolean;
  counts?: LureliaEventCounts;
  recurrence?: unknown;
};

export type LureliaEventArtwork = {
  url: string;
  thumbnailURL?: string;
  bannerURL?: string;
  width?: number;
  height?: number;
  altText?: string;
  isPrimary?: boolean;
};

export type LureliaAttendeePreview = {
  _id?: string;
  userID?: string;
  displayName: string;
  avatarURL?: string;
  role?: "host" | "coHost" | "member" | "invited" | "pending" | "banned";
};

export type LureliaDiscussionPreview = {
  _id?: string;
  authorDisplayName?: string;
  authorAvatarURL?: string;
  body?: string;
  createdAt?: string;
  likesCount?: number;
  replyCount?: number;
};

export type LureliaPostPreview = {
  _id?: string;
  title?: string;
  bodyMarkdown?: string;
  bodyHTML?: string;
  authorDisplayName?: string;
  createdAt?: string;
  isPinned?: boolean;
};

export type LureliaAnnouncementPreview = {
  _id?: string;
  title?: string;
  bodyMarkdown?: string;
  bodyHTML?: string;
  authorDisplayName?: string;
  createdAt?: string;
  isPinned?: boolean;
};

export type LureliaRSVPSummary = {
  going: number;
  interested: number;
  declined: number;
  pending: number;
  total: number;
};

export type PublicEventData = {
  event: LureliaSharedEvent;
  artwork: LureliaEventArtwork | null;
  attendeesPreview: LureliaAttendeePreview[];
  rsvpSummary: LureliaRSVPSummary;
  discussionPreview: LureliaDiscussionPreview[];
  postsPreview: LureliaPostPreview[];
  announcementsPreview: LureliaAnnouncementPreview[];
};
