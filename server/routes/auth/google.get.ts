export default defineOAuthGoogleEventHandler({
  async onSuccess(event, { user }) {
    await setUserSession(event, {
      user: {
        id: user.sub,
        name: user.name,
        login: user.email,
        avatar: user.picture
      }
    })
    return sendRedirect(event, '/chat')
  },
  async onError(event) {
    return sendOAuthErrorRedirect(event, 'google')
  }
})
