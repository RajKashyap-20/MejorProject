export const conversationParticipantFields = "name profilePictureUrl";

export function serializeConversation(conversation, viewerId, unreadCount = 0) {
  const isAuthor = conversation.problemAuthor._id.toString() === viewerId;
  const otherUser = isAuthor
    ? conversation.solutionProvider
    : conversation.problemAuthor;

  return {
    id: conversation._id.toString(),
    problem: {
      id: conversation.problem._id.toString(),
      title: conversation.problem.title,
      subject: conversation.problem.subject,
    },
    solutionId: conversation.solution._id
      ? conversation.solution._id.toString()
      : conversation.solution.toString(),
    peer: {
      id: otherUser._id.toString(),
      name: otherUser.name,
      profilePictureUrl: otherUser.profilePictureUrl || "",
    },
    updatedAt: conversation.updatedAt,
    unreadCount,
  };
}

export function serializeMessage(message, privateImageUrl = "") {
  const senderId = message.sender?._id
    ? message.sender._id.toString()
    : message.sender?.toString() ?? "";
  return {
    id: message._id.toString(),
    senderId,
    sender: message.sender?.name
      ? {
          id: senderId,
          name: message.sender.name,
          profilePictureUrl: message.sender.profilePictureUrl || "",
        }
      : null,
    text: message.text || "",
    imageUrl: privateImageUrl || message.imageUrl || "",
    readBy: message.readBy.map((id) => id.toString()),
    createdAt: message.createdAt,
  };
}
