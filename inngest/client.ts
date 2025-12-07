import { Inngest } from 'inngest'

/**
 * Inngest client instance
 * Used to create and trigger workflows
 */
export const inngest = new Inngest({
  id: 'reddit-idea-generator',
})
