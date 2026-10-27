export class StoredFileEntity {
  /** Public URL to save in imageUrl / coverImageUrl / avatarUrl */
  url: string;
  /** Storage id to save in imagePublicId / coverImagePublicId / avatarPublicId so replaced images get cleaned up */
  publicId: string;
}
