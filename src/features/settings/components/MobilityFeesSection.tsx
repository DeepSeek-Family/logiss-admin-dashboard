import { useState } from 'react';
import {
  Plus,
  Edit2,
  Accessibility,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { MobilityModal } from './MobilityModal';
import { imageUrl } from '@/utils/imageUrl';
import { apiErrorMessage } from '@/features/bookings/utils/helpers';
import {
  useGetMobilitiesQuery,
  useCreateMobilityMutation,
  useUpdateMobilityMutation,
  type IMobility,
} from '@/redux/api/mobilityApi';
import toast from 'react-hot-toast';

const actionBtn = 'h-10 rounded-xl px-4 text-sm';

export type MobilityModalItem = {
  id: string;
  name: string;
  price: number;
  iconUrl?: string;
  status?: boolean;
};

interface MobilityFeesSectionProps {
  canEdit?: boolean;
}

export const MobilityFeesSection = ({ canEdit = true }: MobilityFeesSectionProps) => {
  const { data, isLoading, isError, error, refetch } = useGetMobilitiesQuery();
  const [createMobility, { isLoading: isCreating }] = useCreateMobilityMutation();
  const [updateMobility, { isLoading: isUpdating }] = useUpdateMobilityMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<MobilityModalItem | null>(null);

  const items = data?.data || [];
  const saving = isCreating || isUpdating;

  const toModalItem = (m: IMobility): MobilityModalItem => ({
    id: m._id,
    name: m.name,
    price: m.price,
    iconUrl: imageUrl(m.icon) || undefined,
    status: m.status !== false,
  });

  const handleSave = async (payload: { name: string; price: number; imageFile?: File }) => {
    try {
      if (selected?.id) {
        await updateMobility({
          id: selected.id,
          body: {
            name: payload.name,
            price: payload.price,
            ...(payload.imageFile ? { image: payload.imageFile } : {}),
          },
        }).unwrap();
        toast.success('Mobility updated');
      } else {
        if (!payload.imageFile) {
          toast.error('Please upload an icon image');
          return;
        }
        await createMobility({
          name: payload.name,
          price: payload.price,
          image: payload.imageFile,
        }).unwrap();
        toast.success('Mobility added');
      }
      setIsModalOpen(false);
      setSelected(null);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to save mobility'));
    }
  };

  return (
    <>
      <section className="rounded-xl border border-line-2 bg-white overflow-hidden">
        <header className="flex items-center justify-between gap-4 px-5 py-4 border-b border-line-2 bg-primary-tint/60">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white bg-primary">
              2
            </span>
            <h2 className="text-sm font-semibold text-primary">Mobility</h2>
          </div>
          {canEdit && (
            <Button
              variant="primary"
              size="md"
              className={actionBtn}
              disabled={saving}
              onClick={() => {
                setSelected(null);
                setIsModalOpen(true);
              }}
            >
              <Plus size={16} /> Add
            </Button>
          )}
        </header>

        <div className="p-5">
          {isLoading && (
            <div className="py-10 flex flex-col items-center gap-2 text-ink-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-sm">Loading mobility fees…</p>
            </div>
          )}

          {isError && (
            <div className="py-10 flex flex-col items-center gap-2 text-center">
              <AlertTriangle className="text-urgent opacity-60" size={28} />
              <p className="text-sm text-ink-3">{apiErrorMessage(error, 'Failed to load mobility')}</p>
              <button type="button" onClick={() => refetch()} className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium">
                Retry
              </button>
            </div>
          )}

          {!isLoading && !isError && (
            <div className="rounded-xl border border-line-2 divide-y divide-line-2">
              {items.length === 0 ? (
                <div className="py-10 text-center text-sm text-ink-4">No mobility options yet</div>
              ) : (
                items.map(mob => {
                  const iconUrl = imageUrl(mob.icon);
                  return (
                    <div key={mob._id} className={`flex items-center gap-3 min-h-12 py-3 px-4 ${mob.status === false ? 'opacity-50' : ''}`}>
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {iconUrl ? (
                          <img src={iconUrl} alt="" className="w-8 h-8 rounded-lg object-contain border border-line-2 bg-white p-0.5 shrink-0" />
                        ) : (
                          <Accessibility size={16} className="text-ink-4 shrink-0" />
                        )}
                        <span className="text-sm font-semibold text-ink truncate">{mob.name}</span>
                      </div>
                      <span className="w-20 shrink-0 text-right text-sm font-semibold text-ink tabular-nums">
                        {mob.price > 0 ? `+$${Number(mob.price).toFixed(2)}` : '$0'}
                      </span>
                      {canEdit && (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => {
                            setSelected(toModalItem(mob));
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-ink-4 hover:text-primary hover:bg-primary/10 rounded-lg shrink-0"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </section>

      <MobilityModal
        isOpen={isModalOpen}
        mobility={selected}
        saving={saving}
        onClose={() => {
          setIsModalOpen(false);
          setSelected(null);
        }}
        onSave={handleSave}
      />
    </>
  );
};
