export const BASE_URL = "http://localhost:3000/api";

export const getAllUsers = async () => {
  try {
    const res = await fetch(`${BASE_URL}/user/get-users`, {
      credentials: "include",
    });
    const data = await res.json();
    return data;
  } catch (error) {}
};

export const getConversation = async (conversationId: string) => {
  try {
    const res = await fetch(
      `${BASE_URL}/conversation/get-conversation/${conversationId}`,
      {
        credentials: "include",
      }
    );
    const data = await res.json();
    return data;
  } catch (error) {}
};
