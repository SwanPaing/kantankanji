export const base44 = {
  auth: {
    me: async () => null,
    logout: (redirectUrl?: string) => {
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    },
    redirectToLogin: (redirectUrl?: string) => {
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    },
  },
  entities: {
    VocabWord: {
      filter: async (_params: unknown) => [],
      create: async (_body: unknown) => ({}),
      delete: async (_id: string) => ({}),
    },
  },
};
