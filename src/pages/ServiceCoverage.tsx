import { MapPin } from 'lucide-react';
import { Badge } from '@/shared/components/ui';
import { CoverageTab } from '@/features/settings';
import { usePricing } from '@/hooks/usePricing';

interface ServiceCoverageProps {
  role?: string | null;
}

const ServiceCoverage = ({ role }: ServiceCoverageProps) => {
  const { pricing } = usePricing();
  const activeCountiesCount = (pricing.counties || []).filter(c => c.status === 'active').length;
  const activeMobilityCount = (pricing.mobilityTypes || []).filter(m => m.status === 'active').length;

  return (
    <div className="w-full max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <MapPin size={20} />
            </div>
            <div>
              <h1 className="type-page-title">Service Coverage & Pricing</h1>
              <p className="text-ink-3 font-medium mt-0.5">
                Manage service county territories, inside/outside fares, and mobility surcharge rates
              </p>
            </div>
          </div>
        </div>

        {/* Quick summary badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="accent" dot>
            {activeCountiesCount} Active Counties
          </Badge>
          <Badge variant="primary">
            {activeMobilityCount} Mobility Types
          </Badge>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full">
        <CoverageTab role={role} />
      </div>
    </div>
  );
};

export default ServiceCoverage;
