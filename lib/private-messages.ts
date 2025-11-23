import { getFirebaseDatabase } from "./firebase"
import { ref, push, set, onValue, update, get } from "firebase/database"
import type { PrivateMessage, PrivateChatContact } from "@/types/private-message"

export async function sendPrivateMessage(
  senderId: string,
  senderName: string,
  senderDepartment: string,
  recipientId: string,
  recipientName: string,
  content: string,
): Promise<void> {
  try {
    const db = getFirebaseDatabase()
    const messagesRef = ref(db, "privateMessages")
    const newMessageRef = push(messagesRef)

    const message: Omit<PrivateMessage, "id"> = {
      senderId,
      senderName,
      senderDepartment,
      recipientId,
      recipientName,
      content,
      createdAt: new Date(),
      read: false,
    }

    await set(newMessageRef, message)
  } catch (error) {
    console.error("[v0] Erro ao enviar mensagem privada:", error)
    throw error
  }
}

export function listenToPrivateMessages(userId: string, callback: (messages: PrivateMessage[]) => void): () => void {
  try {
    const db = getFirebaseDatabase()
    const messagesRef = ref(db, "privateMessages")

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val()
      if (!data) {
        callback([])
        return
      }

      const messages: PrivateMessage[] = Object.entries(data)
        .map(([id, value]: [string, any]) => ({
          id,
          ...value,
          createdAt: new Date(value.createdAt),
        }))
        .filter((msg) => msg.senderId === userId || msg.recipientId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

      callback(messages)
    })

    return unsubscribe
  } catch (error) {
    console.error("[v0] Erro ao iniciar listener de mensagens privadas:", error)
    return () => {}
  }
}

export async function markMessageAsRead(messageId: string): Promise<void> {
  try {
    const db = getFirebaseDatabase()
    const messageRef = ref(db, `privateMessages/${messageId}`)
    await update(messageRef, { read: true })
  } catch (error) {
    console.error("[v0] Erro ao marcar mensagem como lida:", error)
  }
}

export async function addPrivateChatContact(
  userId: string,
  contactUserId: string,
  contactUsername: string,
  contactDepartment: string,
): Promise<void> {
  try {
    const db = getFirebaseDatabase()
    const contactRef = ref(db, `privateChatContacts/${userId}/${contactUserId}`)

    const contact: PrivateChatContact = {
      userId: contactUserId,
      username: contactUsername,
      department: contactDepartment,
      allowedBy: userId,
    }

    await set(contactRef, contact)
  } catch (error) {
    console.error("[v0] Erro ao adicionar contato:", error)
    throw error
  }
}

export async function removePrivateChatContact(userId: string, contactUserId: string): Promise<void> {
  try {
    const db = getFirebaseDatabase()
    const contactRef = ref(db, `privateChatContacts/${userId}/${contactUserId}`)
    await set(contactRef, null)
  } catch (error) {
    console.error("[v0] Erro ao remover contato:", error)
    throw error
  }
}

export function listenToPrivateChatContacts(
  userId: string,
  callback: (contacts: PrivateChatContact[]) => void,
): () => void {
  try {
    const db = getFirebaseDatabase()
    const contactsRef = ref(db, `privateChatContacts/${userId}`)

    const unsubscribe = onValue(contactsRef, (snapshot) => {
      const data = snapshot.val()
      if (!data) {
        callback([])
        return
      }

      const contacts: PrivateChatContact[] = Object.values(data)
      callback(contacts)
    })

    return unsubscribe
  } catch (error) {
    console.error("[v0] Erro ao iniciar listener de contatos:", error)
    return () => {}
  }
}

export async function getAllUsers(): Promise<Array<{ id: string; username: string; department: string }>> {
  try {
    const db = getFirebaseDatabase()
    const usersRef = ref(db, "usuarios")
    const snapshot = await get(usersRef)

    if (!snapshot.exists()) {
      return []
    }

    const data = snapshot.val()
    return Object.entries(data).map(([id, value]: [string, any]) => ({
      id,
      username: value.username,
      department: value.department,
    }))
  } catch (error) {
    console.error("[v0] Erro ao buscar usuários:", error)
    return []
  }
}
