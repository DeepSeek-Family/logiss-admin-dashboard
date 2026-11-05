import { SecurityTab } from "@/features/settings";

const Settings = () => {
  return (
    <div className="w-full max-w-6xl mx-auto pb-16 px-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="type-page-title">System Settings</h1>
          <p className="text-ink-3 font-semibold mt-1 tracking-normal">
            Security and account preferences
          </p>
        </div>
      </div>

      <div className="w-full">
        <SecurityTab />
      </div>
    </div>
  );
};

export default Settings;
