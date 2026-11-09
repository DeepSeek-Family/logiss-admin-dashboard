import { useEffect, useRef, useState } from "react";
import { User, Mail, Phone, MapPin, Camera, Loader2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { Card, Badge, Button, QueryFeedback } from "@/shared/components/ui";
import {
  getUserDisplayId,
  getUserFullName,
  getUserInitials,
  getUserProfileImage,
  getUserRoleLabel,
} from "@/shared/utils/userProfileDisplay";
import { getUserFacingApiError } from "@/utils/apiError";
import { resolveMediaUrl } from "@/utils/imageUrl";
import {
  useGetCurrentUserProfileQuery,
  useUpdateCurrentUserProfileMutation,
} from "@/redux/api/userApi";

const MAX_PROFILE_PHOTO_BYTES = 2 * 1024 * 1024;

const Field = ({
  label,
  icon: Icon,
  value,
  onChange,
  readOnly = false,
}: {
  label: string;
  icon: typeof User;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}) => (
  <div>
    <p className="text-xs font-semibold text-ink-4 mb-1.5">{label}</p>
    <div className="relative">
      <Icon
        size={14}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none"
      />
      <input
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        readOnly={readOnly}
        placeholder="Not available"
        className={`w-full pl-10 pr-4 text-sm font-medium transition-colors border h-11 rounded-xl border-line-2 text-ink bg-bg focus:outline-none ${readOnly ? "opacity-60 cursor-not-allowed" : "focus:border-primary/30 focus:bg-white"}`}
      />
    </div>
  </div>
);

const Profile = ({ role }: { role?: string | null }) => {
  const { data, error, isError, isLoading, refetch } = useGetCurrentUserProfileQuery();
  const [updateProfile, { isLoading: isSaving }] = useUpdateCurrentUserProfileMutation();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const profile = data?.data;
  const name = getUserFullName(profile);
  const initials = getUserInitials(profile);
  const profileImage = resolveMediaUrl(getUserProfileImage(profile));
  const displayImg = previewImg || (!imageFailed ? profileImage : undefined);

  useEffect(() => {
    setImageFailed(false);
  }, [profileImage]);

  useEffect(() => {
    if (!profile) return;
    setFullName(getUserFullName(profile) === "User" ? "" : getUserFullName(profile));
    setPhone(profile.phone || profile.contact || "");
    setRegion(profile.reportingRegion || profile.region || "");
  }, [profile]);

  const handleSave = async () => {
    const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
    if (nameParts.length === 0) {
      toast.error("Full name is required.");
      return;
    }

    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
    const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "";

    try {
      const result = await updateProfile({
        firstName,
        middleName,
        lastName,
        contact: phone,
        region,
        ...(photo ? { profile: photo } : {}),
      }).unwrap();
      setPhoto(null);
      setPreviewImg(null);
      if (fileRef.current) fileRef.current.value = "";
      toast.success(result.message || "Profile updated successfully.");
    } catch (saveError) {
      toast.error(getUserFacingApiError(saveError));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_PROFILE_PHOTO_BYTES) {
      toast.error("Photo is too large (max 2 MB).");
      e.target.value = "";
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Upload a JPG, PNG, or WebP photo.");
      e.target.value = "";
      return;
    }
    setPhoto(file);
    setPreviewImg(URL.createObjectURL(file));
  };

  useEffect(
    () => () => {
      if (previewImg) URL.revokeObjectURL(previewImg);
    },
    [previewImg],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64 text-ink-4">
        <Loader2 className="w-5 h-5 mr-2 animate-spin text-primary" />
        Loading profile…
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <QueryFeedback
        title="Unable to load profile"
        message={getUserFacingApiError(error)}
        onRetry={() => void refetch()}
      />
    );
  }

  const employeeId = getUserDisplayId(profile);
  const department = typeof profile.department === "string" ? profile.department : "";

  return (
    <div className="max-w-2xl pb-16 mx-auto duration-300">
      <div className="flex items-center gap-5 pb-8 mb-8 border-b border-line-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="type-page-title">{name}</h1>
            <Badge variant="primary-light" className="text-xs">
              {getUserRoleLabel(profile, role)}
            </Badge>
          </div>
          {(employeeId !== "Not available" || department) && (
            <p className="text-sm text-ink-4 mt-0.5">
              {employeeId}
              {department ? ` · ${department}` : ""}
            </p>
          )}
        </div>
        <Button variant="primary" onClick={handleSave} disabled={isSaving} className="shrink-0">
          {isSaving ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Saving
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>

      <Card className="p-6 space-y-6">
        <div>
          <p className="mb-4 type-th">Profile Photo</p>
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <div className="flex items-center justify-center w-20 h-20 overflow-hidden text-xl font-semibold border-2 shadow-md rounded-2xl border-line bg-bg text-primary">
                {displayImg ? (
                  <img
                    src={displayImg}
                    alt={name}
                    className="object-cover w-full h-full"
                    onError={() => setImageFailed(true)}
                  />
                ) : (
                  initials
                )}
              </div>
              {previewImg && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-accent rounded-full flex items-center justify-center shadow">
                  <CheckCircle2 size={11} className="text-white" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                variant="outline"
                size="sm"
                icon={Camera}
                onClick={() => fileRef.current?.click()}
              >
                {previewImg ? "Change Photo" : "Upload Photo"}
              </Button>
              {previewImg && (
                <button
                  type="button"
                  onClick={() => {
                    setPreviewImg(null);
                    setPhoto(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="block text-xs font-semibold transition-colors text-ink-4 hover:text-urgent"
                >
                  Remove
                </button>
              )}
              <p className="text-xs text-ink-4">JPG, PNG or WebP · Max 2MB</p>
            </div>
          </div>
        </div>

        <div className="pt-5 border-t border-line-2">
          <p className="mb-5 type-th">Personal Information</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full Name" icon={User} value={fullName} onChange={setFullName} />
            <Field label="Email Address" icon={Mail} value={profile.email || ""} readOnly />
            <Field label="Phone Number" icon={Phone} value={phone} onChange={setPhone} />
            <Field label="Reporting Region" icon={MapPin} value={region} onChange={setRegion} />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Profile;
