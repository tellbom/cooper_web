import type { CooperNotice } from './types'

export const isPinnedNotice = (notice: CooperNotice) => Number(notice.IsTop) === 1

// The popup endpoint determines eligibility; preserve its order within each pin group.
// IsTopTime has no documented expiry semantics, so do not hide notices based on it.
export const orderPopupNotices = (notices: CooperNotice[]) => [...notices].sort((a, b) => Number(isPinnedNotice(b)) - Number(isPinnedNotice(a)))
