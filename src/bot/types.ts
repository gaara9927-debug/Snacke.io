export type BotGiftId='rose'|'doughnut'|'heart_me'|'galaxy';
export interface VisionDetection { giftId:BotGiftId; giftName:string; username:string; displayName:string; avatar:string; repeatCount:number; confidence:number; fingerprint:string; }
export interface BotStats { totalEvents:number; ignored:number; duplicates:number; lastGift?:VisionDetection; }
