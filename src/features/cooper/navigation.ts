import type { PendingTaskItem } from './types'
import { safeLink } from './links'

// UI destinations are independent from API gateway addresses. Fill these in the intranet environment.
export const inboxNavigation = {
    processCenter: String(import.meta.env.VITE_PROCESS_CENTER_URL || ''),
    processTask: String(import.meta.env.VITE_PROCESS_TASK_URL || ''),
    messageCenter: String(import.meta.env.VITE_MESSAGE_CENTER_URL || ''),
}
export function taskLink(task: PendingTaskItem, config = inboxNavigation) {
    const template = config.processTask || config.processCenter
    return safeLink(template.replace(/\{(taskId|businessId)\}/g, (_, key: 'taskId' | 'businessId') => encodeURIComponent(task[key])))
}
