export const authManager = (
  state = { signed: false, token: null, user: { rol: null } },
  action
) => {
  switch (action.type) {
    case 'SIGNIN':
      return {
        ...action.payload,
        signed: true,
      };
    case 'SIGNOUT':
      return {
        signed: false,
        token: null,
        user: { rol: null },
      };
    default:
      return state;
  }
};