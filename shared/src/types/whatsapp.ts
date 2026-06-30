export interface IWhatsappUser {
  id: string;
  phoneNumber: string;
  isVerified: boolean;
  dailyDigestEnabled: boolean;
  dailyDigestTime: string;
  // Only present (server-side) while the number is pending verification.
  verificationCode?: string | null;
  createdAt: Date;
}

export interface ILinkWhatsapp {
  phoneNumber: string;
}
