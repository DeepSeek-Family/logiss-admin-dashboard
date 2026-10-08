import type { IPayment, IPaymentUser } from '@/redux/api/transitionApi'
import { resolveMediaUrl } from '@/utils/imageUrl'

export const mapApiPayment = (payment: IPayment) => {
  const user = typeof payment.userId === 'object' && payment.userId ? (payment.userId as IPaymentUser) : null
  const booking = payment.bookingId
  const bookingId =
    typeof booking === 'object' && booking ? booking._id || booking.id || '' : booking || ''
  const name = [user?.firstName, user?.middleName, user?.lastName].filter(Boolean).join(' ').trim()

  return {
    id: payment._id,
    shortId: `TXN-${payment._id.slice(-6).toUpperCase()}`,
    txnNumber: payment.txnNumber || '',
    tripId: bookingId,
    date: payment.createdAt || payment.updatedAt || '',
    amount: Number(payment.price) || 0,
    status: String(payment.paymentStatus || 'pending').toLowerCase(),
    rider: {
      id: user?._id || (typeof payment.userId === 'string' ? payment.userId : ''),
      name: name || 'Unknown rider',
      initials: `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'R',
      email: user?.email || '',
      contact: user?.contact || '',
      image: resolveMediaUrl(user?.profile),
    },
  }
}

export type MappedPayment = ReturnType<typeof mapApiPayment>
