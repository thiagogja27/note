export interface PrivateMessage {
  id: string
  senderId: string
  senderName: string
  senderDepartment: string
  recipientId: string
  recipientName: string
  content: string
  createdAt: Date
  read: boolean
}

export interface PrivateChatContact {
  userId: string
  username: string
  department: string
  allowedBy: string // User ID who allowed this contact
}
