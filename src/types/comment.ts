export interface ZDAttachment {
  id: number
  file_name: string
  content_url: string
  content_type: string
  size: number
  thumbnails?: Array<{ content_url: string; width: number; height: number }>
}

export interface ZDComment {
  id: number
  author_id: number
  author_name: string
  body: string
  public: boolean
  created_at: string
  attachments: ZDAttachment[]
}
