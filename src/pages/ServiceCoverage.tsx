import { CoverageTab } from '@/features/settings';

interface ServiceCoverageProps {
  role?: string | null;
}

const ServiceCoverage = ({ role }: ServiceCoverageProps) => {
  return (
    <div className="w-full max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      <div className="mb-6">
        <h1 className="type-page-title">Service & Tariffs</h1>
      </div>
      <CoverageTab role={role} />
    </div>
  );
};

export default ServiceCoverage;
