export default defineOAuthGitHubEventHandler({
  async onSuccess(event, { user }) {
    await setUserSession(event, {
      user: {
        id: String(user.id),
        name: (user.name || user.login) as string,
        login: user.login as string,
        avatar: user.avatar_url as string
      }
    })
    return sendRedirect(event, '/chat')
  },
  async onError(event) {
    return sendOAuthErrorRedirect(event, 'github')
  }
})
