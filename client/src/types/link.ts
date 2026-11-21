/** Response of POST /api/links — mirrors the server's LinkResponseDto. */
export interface LinkDto {
  code: string
  shortUrl: string
  originalUrl: string
  customAlias: string | null
  clickCount: number
  /** ISO 8601 */
  createdAt: string
}
