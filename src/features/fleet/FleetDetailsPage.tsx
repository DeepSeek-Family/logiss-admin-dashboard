import { useEffect, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, ChevronLeft, Hash, Loader2, Gauge, Users,
  CalendarClock, Shield, RefreshCw, Truck, FileText,
} from 'lucide-react';
import { Card, Badge, Button, StatCard } from '@/shared/components/ui';
import { useGetVehicleByIdQuery } from '@/redux/api/vehiclesMangeApi';
import { apiErrorMessage } from '@/features/bookings/utils/helpers';

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  // Backend stores calendar dates as UTC midnight; format in UTC so the day doesn't shift.
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
};

const formatDateTime = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? '—'
    : d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const formatConfiguration = (val?: string) =>
  val ? val.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—';

const isPast = (iso?: string) => {
  if (!iso) return false;
  const d = new Date(iso);
  return !isNaN(d.getTime()) && d.getTime() < Date.now();
};

const DetailRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex items-center justify-between gap-4 py-2.5 border-b border-line-2 border-dashed last:border-b-0">
    <span className="text-xs text-ink-4">{label}</span>
    <span className="text-xs font-medium text-ink text-right">{value}</span>
  </div>
);

const FleetDetails = (_props: { role?: string | null }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data, isLoading, isError, error, refetch, isFetching } = useGetVehicleByIdQuery(id as string, {
    skip: !id,
    refetchOnMountOrArgChange: true,
  });
  const vehicle = data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-ink-4">Loading vehicle...</p>
        </div>
      </div>
    );
  }

  if (isError || !vehicle) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center p-8">
        <div className="w-20 h-20 bg-urgent-light text-urgent rounded-3xl flex items-center justify-center mb-6">
          <AlertTriangle size={40} />
        </div>
        <h2 className="text-2xl font-semibold text-ink mb-2">{isError ? 'Failed to load vehicle' : 'Vehicle Not Found'}</h2>
        <p className="text-ink-3 mb-8 max-w-sm">
          {isError ? apiErrorMessage(error, 'Something went wrong while fetching this vehicle.') : `The vehicle with ID #${id} could not be located.`}
        </p>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/fleet')}>Back to Fleet</Button>
          {isError && <Button variant="primary" icon={RefreshCw} onClick={() => refetch()}>Retry</Button>}
        </div>
      </div>
    );
  }

  const insuranceExpired = isPast(vehicle.insuranceExpirationDate);
  const serviceOverdue = isPast(vehicle.nextServiceDate);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/fleet')}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-line-2 text-ink-3 hover:text-primary hover:border-primary/20 transition-all shadow-sm"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="type-page-title">{vehicle.manufacturer} {vehicle.model}</h1>
            <Badge variant={vehicle.isActive === false ? 'urgent' : 'accent'}>
              {vehicle.isActive === false ? 'Inactive' : 'Active'}
            </Badge>
            {isFetching && <Loader2 size={16} className="text-primary animate-spin" />}
          </div>
          <p className="text-xs text-ink-4 flex items-center gap-2 mt-1">
            <Hash size={14} className="text-primary" /> {vehicle._id} ·{' '}
            <span className="text-ink bg-bg px-2 py-0.5 rounded border border-line-2">{vehicle.licensePlateNumber || '—'}</span> · {vehicle.year || '—'}
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Odometer" value={`${(vehicle.odometer ?? 0).toLocaleString()} mi`} icon={Gauge} />
        <StatCard label="Max Passengers" value={vehicle.maxPassengers ?? '—'} icon={Users} sub="Rider limit" />
        <StatCard
          label="Next Service"
          value={formatDate(vehicle.nextServiceDate)}
          icon={CalendarClock}
          accent={serviceOverdue ? 'urgent' : 'primary'}
          sub={serviceOverdue ? 'Overdue' : undefined}
        />
        <StatCard
          label="Insurance Expires"
          value={formatDate(vehicle.insuranceExpirationDate)}
          icon={Shield}
          accent={insuranceExpired ? 'urgent' : 'accent'}
          sub={insuranceExpired ? 'Expired' : 'Valid'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h4 className="type-th mb-4 flex items-center gap-2"><Truck size={14} className="text-primary" /> Vehicle Information</h4>
          <DetailRow label="Manufacturer" value={vehicle.manufacturer || '—'} />
          <DetailRow label="Model" value={vehicle.model || '—'} />
          <DetailRow label="Year" value={vehicle.year || '—'} />
          <DetailRow label="License Plate" value={vehicle.licensePlateNumber || '—'} />
          <DetailRow label="VIN Number" value={<span className="font-mono">{vehicle.vinNumber || '—'}</span>} />
          <DetailRow label="Configuration" value={formatConfiguration(vehicle.configurationType)} />
          <DetailRow label="Max Passengers" value={vehicle.maxPassengers ?? '—'} />
          <DetailRow label="Odometer" value={`${(vehicle.odometer ?? 0).toLocaleString()} mi`} />
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <h4 className="type-th mb-4 flex items-center gap-2"><Shield size={14} className="text-primary" /> Insurance & Service</h4>
            <DetailRow label="Carrier Provider" value={vehicle.carrierProvider || '—'} />
            <DetailRow label="Policy Number" value={vehicle.policyNumber || '—'} />
            <DetailRow
              label="Insurance Expiration"
              value={<span className={insuranceExpired ? 'text-urgent' : ''}>{formatDate(vehicle.insuranceExpirationDate)}</span>}
            />
            <DetailRow
              label="Next Service Date"
              value={<span className={serviceOverdue ? 'text-urgent' : ''}>{formatDate(vehicle.nextServiceDate)}</span>}
            />
          </Card>

          <Card className="p-6">
            <h4 className="type-th mb-4 flex items-center gap-2"><FileText size={14} className="text-primary" /> Record</h4>
            <DetailRow label="Status" value={vehicle.isActive === false ? 'Inactive' : 'Active'} />
            <DetailRow label="Created" value={formatDateTime(vehicle.createdAt)} />
            <DetailRow label="Last Updated" value={formatDateTime(vehicle.updatedAt)} />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FleetDetails;
