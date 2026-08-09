<<<<<<< HEAD
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
=======
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
>>>>>>> 5db5a9378ee347600fc6d98b99866292a8ce424d
