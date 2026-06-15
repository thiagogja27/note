'use client'

import { db } from "./firebase"
import { ref, push, set, onValue, update, get, query, orderByChild, equalTo } from "firebase/database"
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
    const messagesRef = ref(db, "privateMessages")
    const newMessageRef = push(messagesRef)

    const message: Omit<PrivateMessage, "id"> = {
      senderId,
      senderName,
      senderDepartment,
      recipientId,
      recipientName,
      content,
      createdAt: new Date().toISOString(), // Salva como string ISO
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
    const messagesRef = ref(db, "privateMessages")

    const sentMessagesQuery = query(messagesRef, orderByChild('senderId'), equalTo(userId));
    const receivedMessagesQuery = query(messagesRef, orderByChild('recipientId'), equalTo(userId));

    let sentMessages: PrivateMessage[] = [];
    let receivedMessages: PrivateMessage[] = [];

    const mapDataToMessages = (data: any): PrivateMessage[] => {
        return data ? Object.entries(data).map(([id, value]: [string, any]) => {
            const createdAtDate = new Date(value.createdAt);
            return {
                id,
                ...value,
                createdAt: isNaN(createdAtDate.getTime()) ? new Date() : createdAtDate,
            };
        }) : [];
    };

    const combineAndSend = () => {
      const allMessages = [...sentMessages, ...receivedMessages];
      const uniqueMessages = Array.from(new Map(allMessages.map(m => [m.id, m])).values());
      const sortedMessages = uniqueMessages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      callback(sortedMessages);
    };

    const onSentValue = onValue(sentMessagesQuery, (snapshot) => {
      sentMessages = mapDataToMessages(snapshot.val());
      combineAndSend();
    }, (error) => {
        console.error("[v0] Erro ao ouvir mensagens enviadas:", error);
    });

    const onReceivedValue = onValue(receivedMessagesQuery, (snapshot) => {
      receivedMessages = mapDataToMessages(snapshot.val());
      combineAndSend();
    }, (error) => {
        console.error("[v0] Erro ao ouvir mensagens recebidas:", error);
    });

    return () => {
      onSentValue();
      onReceivedValue();
    };
  } catch (error) {
    console.error("[v0] Erro ao iniciar listener de mensagens privadas:", error)
    return () => {}
  }
}


export async function markMessageAsRead(messageId: string): Promise<void> {
  try {
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
