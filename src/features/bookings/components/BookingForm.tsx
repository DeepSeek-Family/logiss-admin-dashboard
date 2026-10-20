import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User as UserIcon, Navigation, Clock,
  ShieldCheck, Car, Plus, Minus, Search, X,
  Info, ArrowRight, Repeat,
  Accessibility, Bed, User, Disc, Zap, FileText,
  DollarSign, Activity, Mail, Tag, Lock, HeartPulse,
  ChevronDown, Check, Loader2
} from 'lucide-react';
import { Card, Badge, Avatar, Button, MultiDatePicker, GoogleAddressInput } from '@/shared/components/ui';
import { money } from '@/utils/helpers';
import toast from 'react-hot-toast';
import {
  useGetAllBookingsQuery,
  useGetAllPayersQuery,
  useCalculateBookingPriceMutation,
  useManualCreateBookingMutation,
  ICreateBookingPayload,
  ICalculatedBookingPrice,
  ICalculateBookingPriceBody,
} from '@/redux/api/bookingApi';
import { useGetCountiesByPayerQuery } from '@/redux/api/coverageApi';
import { useGetRidersQuery } from '@/redux/api/ridersApi';
import { useGetDriversQuery } from '@/redux/api/driversApi';
import { useGetMobilitiesQuery } from '@/redux/api/mobilityApi';
import { riderFullName } from '@/features/riders/utils/helpers';
import {
  extractBookingPeople,
  resolveMediaUrl,
  toApiTime,
  toGeoJsonPosition,
  toLocationValue,
  toYmd,
  weekdayKeysToNames,
  isMongoId,
  apiErrorMessage,
  validateServiceScheduleTimes,
} from '../utils/helpers';
import {
  quoteFares,
  usePricing,
  DEFAULT_COUNTIES,
  DEFAULT_MOBILITY_TYPES,
  evaluateTripBoundary,
  detectCountyFromAddress,
  findFundingPolicy,
} from '@/hooks/usePricing';
import { geocodeAddress } from '@/utils/geofenceEngine';

const inputClass = "w-full px-3 py-1.5 bg-white border border-line-2 rounded-lg text-sm text-ink outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-ink-4 h-9 shadow-sm";
const disabledInputClass = "w-full px-3 py-1.5 bg-bg border border-line-2 rounded-lg text-sm text-ink-3 outline-none opacity-50 cursor-not-allowed h-9 shadow-none";

const MOBILITY_ICON_MAP: { [key: string]: any } = {
  User,
  Accessibility,
  Bed,
  Disc,
  Zap,
  Info,
  HeartPulse,
  Shield: ShieldCheck,
  Activity,
};

export const BookingForm = () => {
  const navigate = useNavigate();
  const { pricing } = usePricing();
  const [manualCreateBooking, { isLoading: isCreating }] = useManualCreateBookingMutation();
  const [calculateBookingPrice, { isLoading: isCalculatingPrice }] = useCalculateBookingPriceMutation();
  const [calculatedPrice, setCalculatedPrice] = useState<ICalculatedBookingPrice | null>(null);
  const [priceAgreed, setPriceAgreed] = useState(false);
  const { data: bookingsResponse } = useGetAllBookingsQuery({ page: 1, limit: 100 });
  const { data: payersResponse } = useGetAllPayersQuery();
  const { data: mobilitiesResponse } = useGetMobilitiesQuery();

  // Rider backend search state
  const [existingSearch, setExistingSearch] = useState('');
  const [debouncedRiderSearch, setDebouncedRiderSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedRiderSearch(existingSearch.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [existingSearch]);

  const riderQueryParams = useMemo(() => {
    const params: Record<string, any> = { page: 1, limit: 100 };
    if (debouncedRiderSearch) {
      params.searchTerm = debouncedRiderSearch;
    }
    return params;
  }, [debouncedRiderSearch]);

  const { data: ridersResponse, isLoading: ridersLoading, isFetching: ridersFetching } = useGetRidersQuery(
    riderQueryParams,
    { refetchOnMountOrArgChange: true }
  );

  // Driver backend search state
  const [driverSearch, setDriverSearch] = useState('');
  const [debouncedDriverSearch, setDebouncedDriverSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDriverSearch(driverSearch.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [driverSearch]);

  const driverQueryParams = useMemo(() => {
    const params: Record<string, any> = { limit: 100 };
    if (debouncedDriverSearch) {
      params.searchTerm = debouncedDriverSearch;
    }
    return params;
  }, [debouncedDriverSearch]);

  const { data: driversResponse, isLoading: driversLoading, isFetching: driversFetching } = useGetDriversQuery(
    driverQueryParams,
    { refetchOnMountOrArgChange: true }
  );
  const apiPeople = useMemo(() => extractBookingPeople(bookingsResponse?.data || []), [bookingsResponse]);
  const apiPayers = (payersResponse?.data || []).filter((p) => isMongoId(p._id));

  const availableCounties = (pricing.counties && pricing.counties.length > 0)
    ? pricing.counties.filter(c => c.status === 'active')
    : DEFAULT_COUNTIES;

  const availableMobility = useMemo(() => {
    const rawMobilities: any[] = Array.isArray(mobilitiesResponse?.data)
      ? mobilitiesResponse.data
      : Array.isArray(mobilitiesResponse)
      ? mobilitiesResponse
      : [];

    const apiMobilities = rawMobilities
      .filter((m) => isMongoId(m._id) && m.status !== false)
      .map((m) => ({
        id: m._id,
        _id: m._id,
        name: m.name,
        fee: Number(m.price) || 0,
        iconUrl: resolveMediaUrl(m.icon),
        iconKey: undefined as string | undefined,
        status: 'active',
      }));

    if (apiMobilities.length > 0) return apiMobilities;

    if (apiPeople.mobility.length > 0) {
      return apiPeople.mobility
        .filter((m) => isMongoId(m._id))
        .map((m) => ({
          id: m._id,
          _id: m._id,
          name: m.name,
          fee: m.price,
          iconUrl: resolveMediaUrl(m.icon),
          iconKey: undefined as string | undefined,
          status: m.status === false ? 'inactive' : 'active',
        }));
    }

    return (pricing.mobilityTypes && pricing.mobilityTypes.length > 0)
      ? pricing.mobilityTypes
      : DEFAULT_MOBILITY_TYPES;
  }, [mobilitiesResponse, apiPeople.mobility, pricing.mobilityTypes]);

  const [isRiderDropdownOpen, setIsRiderDropdownOpen] = useState(false);
  const riderDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isDriverDropdownOpen, setIsDriverDropdownOpen] = useState(false);
  const driverDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (driverDropdownRef.current && !driverDropdownRef.current.contains(event.target as Node)) {
        setIsDriverDropdownOpen(false);
      }
      if (riderDropdownRef.current && !riderDropdownRef.current.contains(event.target as Node)) {
        setIsRiderDropdownOpen(false);
      }
    };
    if (isDriverDropdownOpen || isRiderDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDriverDropdownOpen, isRiderDropdownOpen]);

  // Recurring Booking state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState<string[]>([]);
  const [recurringEndDate, setRecurringEndDate] = useState('');
  const prevDayRef = useRef<string>('');
  
  const [selectedDates, setSelectedDates] = useState<Date[]>([new Date()]);

  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    phone: '',
    email: '',
    authId: '',
    passengerId: '',
    fundingSourceId: '',
    fundingSource: '',
    payerSourceId: '',
    program: 'Medicaid NEMT',
    source: '',
    authNotes: '',
    county: availableCounties[0]?.name || 'Chesterfield County',
    insideCounty: true,
    pickup: '',
    dropoff: '',
    stops: [] as string[],
    appointmentTime: '',
    requestedPickup: '',
    returnPickup: '',
    tripType: 'one-way',
    isWillCall: false,
    mobility: 'Ambulatory',
    tripReason: 'Medical Appointment',
    totalSeats: 1,
    additionalNotes: '',
    privateNotes: '',
    mobilityId: '',
    grossFare: 0,
    countyContribution: 0,
    manualFareOverride: false,
    overrideReason: '',
    advancePaid: 0,
    estMiles: 10,
    actualMiles: 0,
  });
  const [tripGps, setTripGps] = useState<{ pickup?: [number, number]; dropoff?: [number, number] }>({});
  const [stopsGps, setStopsGps] = useState<([number, number] | undefined)[]>([]);

  const payerIdForCounties = isMongoId(form.payerSourceId) ? form.payerSourceId : '';
  const { data: countiesByPayerResponse } = useGetCountiesByPayerQuery(payerIdForCounties, {
    skip: !payerIdForCounties,
  });

  const apiCountyId = useMemo(() => {
    const list = (countiesByPayerResponse?.data || []).filter((c) => c.isActive !== false);
    if (!list.length) return '';
    const countyName = form.county?.trim().toLowerCase();
    const byName = countyName
      ? list.find((c) => String(c.countyName || '').trim().toLowerCase() === countyName)
      : undefined;
    return (byName || list[0])._id;
  }, [countiesByPayerResponse, form.county]);

  useEffect(() => {
    if (availableMobility.length > 0) {
      const match = availableMobility.find(
        (m: any) => isMongoId(m.id) && (m.id === form.mobilityId || m.name === form.mobility)
      );
      const firstValid = match || availableMobility.find((m: any) => isMongoId(m.id));
      if (firstValid && (!form.mobilityId || !isMongoId(form.mobilityId))) {
        setForm(prev => ({
          ...prev,
          mobility: firstValid.name,
          mobilityId: firstValid.id,
        }));
      }
    }
  }, [availableMobility, form.mobilityId, form.mobility]);

  const fundingPolicies = (pricing.fundingPolicies || []).filter(p => p.active);
  const selectedPolicy =
    findFundingPolicy(form.fundingSourceId || form.fundingSource, pricing) ||
    fundingPolicies[0] ||
    null;

  const apiRiders = (ridersResponse?.data || []).filter((r) => isMongoId(r._id)).map((r) => ({
    id: r._id,
    _id: r._id,
    name: riderFullName(r),
    firstName: r.firstName,
    middleName: r.middleName,
    lastName: r.lastName,
    profile: r.profile,
    email: r.email || '',
    phone: r.contact || '',
    authorizationId: r.authorizationID || '',
  }));

  const apiDriversList = useMemo(() => {
    const rawList: any[] = Array.isArray(driversResponse?.data)
      ? driversResponse.data
      : Array.isArray(driversResponse)
      ? driversResponse
      : Array.isArray((driversResponse as any)?.data?.data)
      ? (driversResponse as any).data.data
      : [];

    return rawList.map((d: any) => {
      const dName = [d.firstName, d.middleName, d.lastName].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim() || 'Driver';
      const initials = `${d.firstName?.[0] || ''}${d.lastName?.[0] || ''}`.toUpperCase() || 'D';
      return {
        id: d._id || d.id || '',
        _id: d._id || d.id || '',
        name: dName,
        initials,
        phone: d.contact || d.phone || '',
        email: d.email || '',
        onDuty: Boolean(d.isOnDuty),
        profile: d.profile,
        vehicle: { plate: d.driverData?.licenseNumber || '', type: 'Van' },
      };
    });
  }, [driversResponse]);

  const driverOptions = useMemo(() => {
    const list = [...apiDriversList];
    apiPeople.drivers.forEach((d) => {
      if (isMongoId(d._id) && !list.some((item) => String(item.id) === String(d._id))) {
        list.push({
          id: d._id,
          _id: d._id,
          name: [d.firstName, d.lastName].filter(Boolean).join(' ').trim() || 'Driver',
          initials: `${d.firstName?.[0] || ''}${d.lastName?.[0] || ''}`.toUpperCase() || 'D',
          phone: '',
          email: '',
          onDuty: true,
          profile: d.profile,
          vehicle: { plate: '', type: 'Van' },
        });
      }
    });
    return list;
  }, [apiDriversList, apiPeople.drivers]);

  const filteredDriverOptions = useMemo(() => {
    if (!driverSearch.trim()) return driverOptions;
    const q = driverSearch.toLowerCase();
    return driverOptions.filter((d) =>
      d.name.toLowerCase().includes(q) ||
      (d.phone && d.phone.toLowerCase().includes(q)) ||
      (d.email && d.email.toLowerCase().includes(q)) ||
      String(d.id).toLowerCase().includes(q)
    );
  }, [driverOptions, driverSearch]);

  const filteredRiders = useMemo(() => {
    if (!existingSearch.trim()) {
      return apiRiders.slice(0, 20);
    }
    const q = existingSearch.toLowerCase().trim();
    const matched = apiRiders.filter(r =>
      (r.name || '').toLowerCase().includes(q) ||
      (r.phone || '').toLowerCase().includes(q) ||
      (r.email || '').toLowerCase().includes(q) ||
      (r.authorizationId || '').toLowerCase().includes(q) ||
      (r.id || '').toLowerCase().includes(q)
    );
    return matched.length > 0 ? matched : apiRiders;
  }, [apiRiders, existingSearch]);

  const handleSelectRider = (rider: any) => {
    setSelectedUserId(rider._id || rider.id || '');
    setForm(prev => ({
      ...prev,
      firstName: rider.firstName || (rider.name || '').split(' ')[0] || '',
      middleName: rider.middleName || '',
      lastName: rider.lastName || (rider.name || '').split(' ').slice(1).join(' ') || '',
      phone: rider.phone || '',
      email: rider.email || '',
      passengerId: rider._id || rider.id || '',
      authId: rider.authorizationId || rider.authId || prev.authId,
    }));
    setExistingSearch('');
    setDebouncedRiderSearch('');
    setIsRiderDropdownOpen(false);
    toast.success(`Selected ${rider.name}`);
  };

  const quote = quoteFares({
    county: form.county,
    insideCounty: form.insideCounty,
    tripType: form.tripType,
    miles: form.estMiles,
    calculatedMiles: form.estMiles,
    actualMiles: form.actualMiles || undefined,
    mobility: form.mobility,
    stops: form.stops,
    fundingSourceId: form.fundingSourceId || selectedPolicy?.id,
    fundingSource: form.fundingSource || selectedPolicy?.name,
    pickup: form.pickup,
    dropoff: form.dropoff,
    tripDate: selectedDates[0] instanceof Date ? selectedDates[0].toISOString() : String(selectedDates[0] || ''),
  }, pricing);

  const boundaryEval = evaluateTripBoundary(
    form.pickup,
    form.dropoff,
    form.county,
    availableCounties,
    selectedPolicy?.serviceAreaIds,
    {
      pickupGps: tripGps.pickup,
      dropoffGps: tripGps.dropoff,
      payerPolygons: selectedPolicy?.geofencePolygons,
    }
  );

  // Calculate the dates for repeating booking
  const getRecurringDates = () => {
    if (selectedDates.length === 0 || selectedDates.length > 1 || !recurringEndDate || recurringDays.length === 0) return [];
    
    // Use the first selected date as the start for recurring logic
    const startDate = new Date(selectedDates[0]);
    startDate.setHours(0, 0, 0, 0);
    
    const end = new Date(recurringEndDate + 'T00:00:00');
    const dates: Date[] = [];
    const current = new Date(startDate);

    // Limit check to avoid infinite loops if end date is set far in the future
    let iterations = 0;
    while (current <= end && iterations < 365) {
      const day = current.getDay().toString();
      if (recurringDays.includes(day)) {
        dates.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
      iterations++;
    }
    return dates;
  };

  const recurringDates = isRecurring ? getRecurringDates() : [];

  useEffect(() => {
    let alive = true;
    (async () => {
      const pickupGps = !tripGps.pickup && form.pickup.trim() ? await geocodeAddress(form.pickup) : tripGps.pickup;
      const dropoffGps = !tripGps.dropoff && form.dropoff.trim() ? await geocodeAddress(form.dropoff) : tripGps.dropoff;
      if (!alive) return;
      setTripGps(prev => {
        const nextPickup = prev.pickup || pickupGps || undefined;
        const nextDropoff = prev.dropoff || dropoffGps || undefined;
        if (nextPickup === prev.pickup && nextDropoff === prev.dropoff) return prev;
        return { pickup: nextPickup, dropoff: nextDropoff };
      });
    })();
    return () => {
      alive = false;
    };
  }, [form.pickup, form.dropoff]);

  useEffect(() => {
    if (!form.pickup || !form.dropoff) return;
    const detected = detectCountyFromAddress(form.pickup, availableCounties, tripGps.pickup);
    const evaluation = evaluateTripBoundary(
      form.pickup,
      form.dropoff,
      form.county || detected.countyName,
      availableCounties,
      selectedPolicy?.serviceAreaIds,
      {
        pickupGps: tripGps.pickup,
        dropoffGps: tripGps.dropoff,
        payerPolygons: selectedPolicy?.geofencePolygons,
      }
    );
    
    setForm(prev => {
      let updated = { ...prev };
      if (prev.insideCounty !== evaluation.isInsideCounty) {
        updated.insideCounty = evaluation.isInsideCounty;
      }
      if (!prev.county && detected.countyName) {
        updated.county = detected.countyName;
      }
      return updated;
    });
  }, [form.pickup, form.dropoff, form.county, availableCounties, selectedPolicy?.serviceAreaIds, selectedPolicy?.geofencePolygons, tripGps.pickup, tripGps.dropoff]);

  useEffect(() => {
    setCalculatedPrice(null);
    setPriceAgreed(false);
  }, [
    form.pickup,
    form.dropoff,
    form.stops.join('|'),
    form.payerSourceId,
    form.tripType,
    form.mobilityId,
    tripGps.pickup?.join(','),
    tripGps.dropoff?.join(','),
    stopsGps.map((s) => s?.join(',') ?? '').join('|'),
    apiCountyId,
  ]);

  // Auto-select the day of the week of the first Service Date
  useEffect(() => {
    if (isRecurring && selectedDates.length > 0) {
      const dayOfWeek = selectedDates[0].getDay().toString();
      setRecurringDays(prev => {
        let updated = [...prev];
        // If we auto-selected a day before, remove it
        if (prevDayRef.current && prevDayRef.current !== dayOfWeek) {
          updated = updated.filter(d => d !== prevDayRef.current);
        }
        // Add the new day if it's not already there
        if (!updated.includes(dayOfWeek)) {
          updated.push(dayOfWeek);
        }
        return updated;
      });
      prevDayRef.current = dayOfWeek;
    }
  }, [isRecurring, selectedDates]);

  // Seed local fare payer (quotes) separately from API payerSource
  useEffect(() => {
    if (!form.fundingSourceId && fundingPolicies[0]) {
      setForm(prev => ({
        ...prev,
        fundingSourceId: fundingPolicies[0].id,
        fundingSource: fundingPolicies[0].name,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only seed once when policies exist
  }, [form.fundingSourceId, pricing.fundingPolicies?.length]);

  useEffect(() => {
    if (form.payerSourceId || apiPayers.length === 0) return;
    setForm(prev => ({ ...prev, payerSourceId: apiPayers[0]._id }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiPayers.length, form.payerSourceId]);

  useEffect(() => {
    if (form.mobilityId || availableMobility.length === 0) return;
    const match = availableMobility.find((m: any) => m.name === form.mobility) || availableMobility[0];
    if (match) {
      setForm(prev => ({ ...prev, mobility: match.name, mobilityId: match.id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableMobility.length, form.mobilityId]);

  const selectedPayerLabel = useMemo(() => {
    const p = apiPayers.find((x) => x._id === form.payerSourceId);
    return p?.name || p?.title || p?.payerName || 'Payer';
  }, [apiPayers, form.payerSourceId]);

  const formatPriceMethodLabel = (method?: string) =>
    String(method || '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Pricing';

  const buildCalculatePricePayload = (): ICalculateBookingPriceBody | null => {
    const pickupRaw = tripGps.pickup || toLocationValue(form.pickup);
    const dropoffRaw = tripGps.dropoff || toLocationValue(form.dropoff);
    if (pickupRaw == null || dropoffRaw == null) return null;

    const mobilityOption = availableMobility.find(
      (m: any) => m.id === form.mobilityId || m.name === form.mobility
    );
    const mobilityId = isMongoId(form.mobilityId)
      ? form.mobilityId
      : isMongoId(mobilityOption?.id)
        ? mobilityOption.id
        : '';
    const payerSource = form.payerSourceId;
    if (!isMongoId(payerSource) || !isMongoId(mobilityId) || !isMongoId(apiCountyId)) return null;

    const stopIdx = form.stops.findIndex((s) => s.trim());
    const stopValue = stopIdx >= 0 ? form.stops[stopIdx].trim() : '';
    const stopRaw =
      stopIdx >= 0 ? stopsGps[stopIdx] || toLocationValue(stopValue) : undefined;

    const payload: ICalculateBookingPriceBody = {
      pickupLocation: toGeoJsonPosition(pickupRaw),
      dropOffLocation: toGeoJsonPosition(dropoffRaw),
      payerSource,
      tripType: form.tripType,
      mobilityRequirements: mobilityId,
      countyId: apiCountyId,
    };
    if (stopRaw != null) payload.stopAddress = toGeoJsonPosition(stopRaw);
    return payload;
  };

  const canCalculatePrice = buildCalculatePricePayload() != null;

  const handleShowPrice = async () => {
    const payload = buildCalculatePricePayload();
    if (!payload) {
      if (!isMongoId(form.payerSourceId)) {
        toast.error('Please select a payer');
        return;
      }
      if (!isMongoId(apiCountyId)) {
        toast.error('No county coverage found for this payer');
        return;
      }
      if (!isMongoId(form.mobilityId)) {
        toast.error('Please select mobility requirement');
        return;
      }
      toast.error('Please enter valid pickup and dropoff locations');
      return;
    }
    try {
      const res = await calculateBookingPrice(payload).unwrap();
      setCalculatedPrice(res.data);
      setPriceAgreed(false);
      toast.success(res.message || 'Price calculated');
    } catch (err: any) {
      toast.error(apiErrorMessage(err, 'Could not calculate price'));
    }
  };

  const passengerCopay = calculatedPrice?.passengerCoPay ?? 0;
  const payerCharge = calculatedPrice?.organizationContribution ?? 0;
  const dueToDriver = Math.max(0, passengerCopay - form.advancePaid);

  const scheduleTimeValidation = useMemo(
    () =>
      validateServiceScheduleTimes({
        requestedPickup: form.requestedPickup,
        appointmentTime: form.appointmentTime,
        returnPickup: form.returnPickup,
        tripType: form.tripType,
        isWillCall: form.isWillCall,
      }),
    [
      form.requestedPickup,
      form.appointmentTime,
      form.returnPickup,
      form.tripType,
      form.isWillCall,
    ],
  );

  const scheduleHasErrors = scheduleTimeValidation.errors.length > 0;

  const pickupApptScheduleError = scheduleTimeValidation.errors.some(
    (e) => !e.toLowerCase().includes('return'),
  );
  const returnScheduleError = scheduleTimeValidation.errors.some((e) =>
    e.toLowerCase().includes('return'),
  );

  const timeInputClass = (field: 'pickup' | 'appointment' | 'return') => {
    if (field === 'return' && returnScheduleError) {
      return `${inputClass} border-urgent/60 ring-1 ring-urgent/20`;
    }
    if ((field === 'pickup' || field === 'appointment') && pickupApptScheduleError) {
      return `${inputClass} border-urgent/60 ring-1 ring-urgent/20`;
    }
    return inputClass;
  };

  const resetManualDispatchForm = () => {
    const defaultMobility = availableMobility.find((m: any) => isMongoId(m.id));
    const defaultPayer = apiPayers[0];
    const defaultPolicy = fundingPolicies[0];
    setForm({
      firstName: '',
      middleName: '',
      lastName: '',
      phone: '',
      email: '',
      authId: '',
      passengerId: '',
      fundingSourceId: defaultPolicy?.id || '',
      fundingSource: defaultPolicy?.name || '',
      payerSourceId: defaultPayer?._id || '',
      program: 'Medicaid NEMT',
      source: '',
      authNotes: '',
      county: availableCounties[0]?.name || 'Chesterfield County',
      insideCounty: true,
      pickup: '',
      dropoff: '',
      stops: [],
      appointmentTime: '',
      requestedPickup: '',
      returnPickup: '',
      tripType: 'one-way',
      isWillCall: false,
      mobility: defaultMobility?.name || 'Ambulatory',
      tripReason: 'Medical Appointment',
      totalSeats: 1,
      additionalNotes: '',
      privateNotes: '',
      mobilityId: defaultMobility?.id || '',
      grossFare: 0,
      countyContribution: 0,
      manualFareOverride: false,
      overrideReason: '',
      advancePaid: 0,
      estMiles: 10,
      actualMiles: 0,
    });
    setTripGps({});
    setStopsGps([]);
    setSelectedDriver(null);
    setSelectedUserId('');
    setIsRecurring(false);
    setRecurringDays([]);
    setRecurringEndDate('');
    setSelectedDates([new Date()]);
    setCalculatedPrice(null);
    setPriceAgreed(false);
    setExistingSearch('');
    setDebouncedRiderSearch('');
    setDriverSearch('');
    setDebouncedDriverSearch('');
    setIsRiderDropdownOpen(false);
    setIsDriverDropdownOpen(false);
    prevDayRef.current = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = selectedUserId || form.passengerId.trim();
    if (!userId) {
      toast.error('Please select an existing passenger');
      return;
    }
    const pickupLocation = tripGps.pickup || toLocationValue(form.pickup);
    const dropOffLocation = tripGps.dropoff || toLocationValue(form.dropoff);
    if (pickupLocation == null || dropOffLocation == null) {
      toast.error('Please enter or select valid pickup and dropoff locations from Google Maps');
      return;
    }
    if (!form.mobilityId && !form.mobility) {
      toast.error('Please select mobility requirement');
      return;
    }
    if (!form.requestedPickup) {
      toast.error('Please select a pickup time');
      return;
    }
    if (!form.appointmentTime) {
      toast.error('Please select an appointment time');
      return;
    }
    if (scheduleTimeValidation.errors.length > 0) {
      toast.error(scheduleTimeValidation.errors[0]);
      return;
    }
    const driverId = selectedDriver?.id || selectedDriver?._id;
    if (!isMongoId(driverId)) {
      toast.error('Please assign a driver');
      return;
    }
    const payerSource = form.payerSourceId || (isMongoId(form.fundingSourceId) ? form.fundingSourceId : '');
    if (!isMongoId(payerSource)) {
      toast.error('Please select a valid payer');
      return;
    }
    if (isRecurring && recurringDays.length === 0) {
      toast.error('Please select at least one day for recurring booking');
      return;
    }
    if (isRecurring && !recurringEndDate) {
      toast.error('Please select an end date for recurring booking');
      return;
    }
    if (isRecurring && selectedDates[0] && new Date(recurringEndDate) < selectedDates[0]) {
      toast.error('End date cannot be earlier than start date');
      return;
    }
    if (selectedDates.length === 0) {
      toast.error('Please select at least one service date');
      return;
    }
    if (!calculatedPrice) {
      toast.error('Please calculate the trip price before completing the booking');
      return;
    }
    if (!priceAgreed) {
      toast.error('Please confirm you agree with the quoted price');
      return;
    }

    const isRound = form.tripType === 'round-trip';
    const stopIdx = form.stops.findIndex((s) => s.trim());
    const stopValue = stopIdx >= 0 ? form.stops[stopIdx].trim() : '';
    const stopAddress = (stopIdx >= 0 && stopsGps[stopIdx]) || (stopValue ? toLocationValue(stopValue) : undefined);
    if (stopValue && stopAddress == null) {
      toast.error('Please enter a valid stop address location');
      return;
    }
    const mobilityOption = availableMobility.find((m: any) => m.id === form.mobilityId || m.name === form.mobility);
    const mobilityId = isMongoId(form.mobilityId)
      ? form.mobilityId
      : isMongoId(mobilityOption?.id)
        ? mobilityOption.id
        : undefined;
    if (!isMongoId(mobilityId)) {
      toast.error('Please select a valid mobility requirement');
      return;
    }

    const buildPayload = (serviceDate: string): ICreateBookingPayload => {
      const payload: ICreateBookingPayload = {
        userId,
        pickupLocation: toGeoJsonPosition(pickupLocation),
        dropOffLocation: toGeoJsonPosition(dropOffLocation),
        tripType: form.tripType,
        tripReason: form.tripReason,
        passengerSeats: form.totalSeats,
        serviceDate,
        pickupTime: toApiTime(form.requestedPickup),
        appointmentTime: toApiTime(form.appointmentTime),
        recurringBooking: isRecurring,
        driverId,
        payerSource,
      };
      if (stopAddress != null) payload.stopAddress = toGeoJsonPosition(stopAddress);
      if (mobilityId) payload.mobilityRequirements = mobilityId;
      if (form.additionalNotes.trim()) payload.tripNote = form.additionalNotes.trim();
      if (form.privateNotes.trim()) payload.internalPrivateNote = form.privateNotes.trim();
      if (form.program) payload.programContext = form.program;
      if (isRound && !form.isWillCall && form.returnPickup) {
        payload.returnTime = toApiTime(form.returnPickup);
      }
      if (isRecurring) {
        payload.selectedDate = weekdayKeysToNames(recurringDays);
        payload.endDate = recurringEndDate;
      }
      return payload;
    };

    const datesToSend = isRecurring ? [selectedDates[0]] : selectedDates;
    const toastId = toast.loading(isRecurring ? 'Creating recurring booking...' : 'Creating booking...');

    try {
      for (const date of datesToSend) {
        await manualCreateBooking(buildPayload(toYmd(date))).unwrap();
      }
      toast.success(
        isRecurring
          ? 'Recurring booking created'
          : datesToSend.length > 1
            ? `${datesToSend.length} bookings created`
            : 'Booking created',
        { id: toastId }
      );
      resetManualDispatchForm();
      navigate('/bookings?tab=confirmed');
    } catch (err: any) {
      toast.error(apiErrorMessage(err, 'Failed to create booking'), { id: toastId });
    }
  };


  const SectionHeader = ({ title, icon: Icon }: { title: string, icon: any }) => (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-1 h-3.5 bg-primary rounded-full" />
      {Icon && <Icon size={16} className="text-primary/80" />}
      <h3 className="text-xs font-medium text-ink">{title}</h3>
    </div>
  );

  return (
    <div className="max-w-[1300px] mx-auto pb-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6 border-b border-line-2 pb-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-white border border-line-2 rounded-lg text-ink-2 hover:text-primary transition-all shadow-sm">
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-xl font-semibold text-ink">Manual Dispatch</h1>
        </div>
        <Badge variant="bg" className="bg-bg text-ink-2 border border-line-2 px-4 py-1 text-xs">Live Console</Badge>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          <Card className="p-6 border-line-2 bg-white shadow-none !overflow-visible relative z-40">
            <div className="flex justify-between items-center mb-4">
              <SectionHeader title="1. Passenger Identification" icon={UserIcon} />
              {selectedUserId && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUserId('');
                    setExistingSearch('');
                    setDebouncedRiderSearch('');
                    setForm(prev => ({
                      ...prev,
                      firstName: '',
                      middleName: '',
                      lastName: '',
                      phone: '',
                      email: '',
                      passengerId: '',
                      authId: '',
                    }));
                    setIsRiderDropdownOpen(true);
                  }}
                  className="text-xs text-urgent hover:underline font-medium"
                >
                  Clear passenger
                </button>
              )}
            </div>

            <div className="space-y-3">
              {selectedUserId && (
                <div
                  onClick={() => setIsRiderDropdownOpen(true)}
                  className="flex items-center justify-between p-3 rounded-xl border border-primary/30 bg-primary/5 cursor-pointer hover:border-primary transition-all group"
                  title="Click to change passenger"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar initials={`${form.firstName?.[0] || ''}${form.lastName?.[0] || 'R'}`} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-ink group-hover:text-primary transition-colors truncate">
                          {form.firstName} {form.lastName}
                        </p>
                        <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded font-medium">Selected</span>
                      </div>
                      <p className="text-[11px] text-ink-4 truncate">
                        {form.phone || form.email || (form.authId ? `Auth: ${form.authId}` : selectedUserId)}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-primary font-medium group-hover:underline ml-2 shrink-0">
                    Change
                  </span>
                </div>
              )}

              <div className="relative" ref={riderDropdownRef}>
                <div className="relative">
                  <input
                    className={`${inputClass} pr-8`}
                    placeholder={selectedUserId ? "Click to search or change passenger..." : "Search passengers by name, phone..."}
                    value={existingSearch}
                    onChange={e => {
                      setExistingSearch(e.target.value);
                      setIsRiderDropdownOpen(true);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        setDebouncedRiderSearch(existingSearch.trim());
                      }
                    }}
                    onFocus={() => setIsRiderDropdownOpen(true)}
                    onClick={() => setIsRiderDropdownOpen(true)}
                  />
                  <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-4" />
                  {existingSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setExistingSearch('');
                        setDebouncedRiderSearch('');
                      }}
                      className="absolute right-8 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Dropdown list - closes when rider selected, opens when field clicked */}
                {isRiderDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-50 border border-line-2 rounded-xl bg-white shadow-xl divide-y divide-line-2 max-h-56 overflow-y-auto p-1 custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-150">
                    {ridersLoading || ridersFetching ? (
                      <div className="flex items-center justify-center gap-2 p-4 text-xs text-ink-3">
                        <Loader2 size={16} className="animate-spin text-primary" />
                        <span>Searching passengers...</span>
                      </div>
                    ) : filteredRiders.length > 0 ? (
                      filteredRiders.map(rider => {
                        const isSelected = selectedUserId === rider.id || selectedUserId === rider._id;
                        return (
                          <button
                            key={rider.id}
                            type="button"
                            onClick={() => handleSelectRider(rider)}
                            className={`w-full text-left p-2.5 hover:bg-bg rounded-lg transition-all flex items-center justify-between group ${
                              isSelected ? 'bg-primary/5 ring-1 ring-primary/30' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Avatar initials={`${rider.firstName?.[0] || ''}${rider.lastName?.[0] || 'R'}`} src={resolveMediaUrl(rider.profile)} size="xs" />
                              <div className="min-w-0">
                                <p className={`text-xs font-semibold truncate ${isSelected ? 'text-primary' : 'text-ink group-hover:text-primary transition-colors'}`}>
                                  {rider.name}
                                </p>
                                <p className="text-[11px] text-ink-4 truncate">
                                  {rider.phone || rider.email || rider.authorizationId || 'Passenger'}
                                </p>
                              </div>
                            </div>
                            <Badge variant="bg" className={`border text-[11px] font-medium ${isSelected ? 'bg-primary text-white border-primary' : 'bg-white border-line-2 text-ink-3'}`}>
                              {isSelected ? 'Selected' : 'Select'}
                            </Badge>
                          </button>
                        );
                      })
                    ) : (
                      <div className="text-center p-4 text-xs text-ink-4">
                        {existingSearch.trim() ? 'No matching passengers found.' : 'No passengers available.'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!selectedUserId && (
                <p className="text-xs font-medium text-urgent px-1">A passenger is required to create this booking</p>
              )}
            </div>
          </Card>

          <Card className="p-6 border-line-2 bg-white shadow-none">
            <SectionHeader title="2. Pickup, Dropoff & County Coverage" icon={Navigation} />
            <div className="space-y-4">
              {/* Service area (commented out for now, can be re-enabled when needed) */}
              {/* <div>
                <label className="text-xs font-medium text-ink-2 mb-1 block">Service area</label>
                <select
                  className={inputClass}
                  value={form.county}
                  onChange={e => setForm({ ...form, county: e.target.value })}
                >
                  {availableCounties.map(c => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.state || 'VA'})
                    </option>
                  ))}
                </select>
              </div> */}

              <div className="relative pl-9">
                <div className="absolute left-0 top-3 w-4 h-4 rounded-full border border-primary bg-white flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-primary" /></div>
                <div className="absolute left-1.5 top-8 bottom-[-32px] w-0.5 border-l border-dashed border-line-2" />
                <label className="text-xs font-medium text-ink-2 mb-1 block">Pickup Location (Google Maps Search)</label>
                <GoogleAddressInput
                  required
                  value={form.pickup}
                  onChange={address => setForm(prev => ({ ...prev, pickup: address }))}
                  onSelectCoords={coords => setTripGps(prev => ({ ...prev, pickup: coords }))}
                  placeholder="Search address, landmark or Google Maps..."
                  className={inputClass}
                />
              </div>
              {form.stops.map((stop, idx) => (
                <div key={idx} className="relative pl-9">
                  <div className="absolute left-0 top-3 w-4 h-4 rounded-full border border-warning bg-white flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-warning" /></div>
                  <div className="absolute left-1.5 top-8 bottom-[-32px] w-0.5 border-l border-dashed border-line-2" />
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-ink-3">Stop {idx + 1}</label>
                    <button type="button" onClick={() => {
                      setForm(prev => ({ ...prev, stops: prev.stops.filter((_, i) => i !== idx) }));
                      setStopsGps(prev => prev.filter((_, i) => i !== idx));
                    }} className="text-xs font-medium text-urgent">Remove</button>
                  </div>
                  <GoogleAddressInput
                    value={stop}
                    onChange={val => {
                      setForm(prev => {
                        const s = [...prev.stops];
                        s[idx] = val;
                        return { ...prev, stops: s };
                      });
                    }}
                    onSelectCoords={coords => {
                      setStopsGps(prev => {
                        const g = [...prev];
                        g[idx] = coords;
                        return g;
                      });
                    }}
                    placeholder="Search stop address or Google Maps..."
                    className={inputClass}
                  />
                </div>
              ))}
              <div className="relative pl-9">
                <div className="absolute left-0 top-3 w-4 h-4 rounded-full border border-urgent bg-white flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-urgent" /></div>
                <label className="text-xs font-medium text-ink-2 mb-1 block">Dropoff Location (Google Maps Search)</label>
                <GoogleAddressInput
                  required
                  value={form.dropoff}
                  onChange={address => setForm(prev => ({ ...prev, dropoff: address }))}
                  onSelectCoords={coords => setTripGps(prev => ({ ...prev, dropoff: coords }))}
                  placeholder="Search address, landmark or Google Maps..."
                  className={inputClass}
                />
              </div>
              <button type="button" onClick={() => setForm({ ...form, stops: [...form.stops, ''] })} className="ml-9 text-xs font-medium text-primary hover:underline">+ Add Stop</button>

              {/* Smart Geofence Auto-Detection Pill */}
              {form.pickup && form.dropoff && (
                <div className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                  boundaryEval.isInsideCounty
                    ? 'bg-accent-light/40 border-accent/30 text-ink'
                    : 'bg-primary/5 border-primary/20 text-ink'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${boundaryEval.isInsideCounty ? 'bg-accent' : 'bg-primary'}`} />
                    <span className="font-semibold">{boundaryEval.boundaryLabel}</span>
                  </div>
                  <span className={`font-bold ${boundaryEval.isInsideCounty ? 'text-accent' : 'text-primary'}`}>
                    {boundaryEval.isInsideCounty
                      ? `Inside · Copay ${money(selectedPolicy?.passengerCopayInside ?? quote.customerUnit)}`
                      : `Outside · Copay ${money(selectedPolicy?.passengerCopayOutside ?? quote.customerUnit)}`}
                  </span>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 border-line-2 bg-white shadow-none">
            <SectionHeader title="3. Mobility Requirements" icon={ShieldCheck} />
            <div className="flex items-center gap-2 flex-wrap">
              {availableMobility.map(opt => {
                const IconComp = MOBILITY_ICON_MAP[(opt as any).iconKey || 'Accessibility'] || Accessibility;
                const isSelected = form.mobilityId === opt.id || form.mobility === opt.name || form.mobility === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setForm({ ...form, mobility: opt.name, mobilityId: opt.id })}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all whitespace-nowrap ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary font-semibold text-primary'
                        : 'border-line-2 bg-bg hover:border-primary/20 text-ink'
                    }`}
                  >
                    {opt.iconUrl ? (
                      <img src={opt.iconUrl} alt={opt.name} className="w-4 h-4 object-contain" />
                    ) : (
                      <IconComp size={16} className={isSelected ? 'text-primary' : 'text-ink-2'} />
                    )}
                    <span className="text-xs font-medium">{opt.name}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="p-6 border-line-2 bg-white shadow-none">
            <SectionHeader title="4. Trip Notes & Instructions" icon={FileText} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-semibold text-ink-3 flex items-center gap-1.5 mb-2">
                  <User size={14} /> Instructions for Driver
                </label>
                <textarea className={`${inputClass} min-h-[120px] resize-none py-3 text-sm leading-relaxed`} value={form.additionalNotes} onChange={e => setForm({ ...form, additionalNotes: e.target.value })} placeholder="Enter special instructions for the driver (e.g. Call when arrived)..." />
                <p className="text-xs text-ink-4 mt-1.5">Visible in Driver App</p>
              </div>
              
              <div>
                <label className="text-xs font-bold text-urgent flex items-center gap-1.5 mb-2">
                  <Lock size={14} /> Internal Private Notes
                </label>
                <textarea className={`${inputClass} min-h-[120px] resize-none py-3 text-sm leading-relaxed bg-urgent/5 border-urgent/20 focus:ring-urgent/10 focus:border-urgent`} value={form.privateNotes} onChange={e => setForm({ ...form, privateNotes: e.target.value })} placeholder="Enter internal notes for dispatchers (e.g. Billing issues, specific client habits)..." />
                <p className="text-xs text-urgent/70 mt-1.5 font-medium">Hidden from Drivers & Customers</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-line-2 bg-white shadow-none !overflow-visible relative z-30">
            <SectionHeader title="7. Driver Allocation" icon={Car} />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-ink-3">Driver <span className="text-urgent">*</span></p>
                {selectedDriver && (
                  <button
                    type="button"
                    onClick={() => setSelectedDriver(null)}
                    className="text-xs text-urgent hover:underline font-medium"
                  >
                    Clear selection
                  </button>
                )}
              </div>

              {/* Searchable Dropdown */}
              <div className="relative" ref={driverDropdownRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsDriverDropdownOpen(prev => !prev);
                    if (!isDriverDropdownOpen) {
                      setDriverSearch('');
                      setDebouncedDriverSearch('');
                    }
                  }}
                  className={`w-full p-3 border rounded-xl flex items-center justify-between gap-3 text-left transition-all ${
                    isDriverDropdownOpen
                      ? 'border-primary ring-2 ring-primary/20 bg-white shadow-sm'
                      : selectedDriver
                      ? 'border-primary/40 bg-primary/5 hover:border-primary'
                      : 'border-line-2 bg-bg/50 hover:bg-white hover:border-line'
                  }`}
                >
                  {selectedDriver ? (
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar initials={selectedDriver.initials} size="sm" src={resolveMediaUrl(selectedDriver.profile)} online={selectedDriver.onDuty} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-ink truncate">{selectedDriver.name}</p>
                          <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded font-medium">
                            Assigned
                          </span>
                        </div>
                        <p className="text-[11px] text-ink-4 truncate">
                          {selectedDriver.phone || selectedDriver.email || selectedDriver.vehicle?.plate || 'Active Driver'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 text-ink-4">
                      <User size={15} className="text-ink-3" />
                      <span className="text-xs">Select a driver from list...</span>
                    </div>
                  )}

                  <ChevronDown
                    size={16}
                    className={`text-ink-4 transition-transform duration-200 shrink-0 ${isDriverDropdownOpen ? 'rotate-180 text-primary' : ''}`}
                  />
                </button>

                {/* Dropdown popup */}
                {isDriverDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-line-2 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* Search inside dropdown */}
                    <div className="p-2.5 border-b border-line-2 bg-bg/20">
                      <div className="relative">
                        <input
                          autoFocus
                          type="text"
                          className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-line-2 rounded-lg text-ink placeholder:text-ink-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                          placeholder="Search drivers by name, phone..."
                          value={driverSearch}
                          onChange={e => setDriverSearch(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              setDebouncedDriverSearch(driverSearch.trim());
                            }
                          }}
                        />
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-4" />
                        {driverSearch && (
                          <button
                            type="button"
                            onClick={() => {
                              setDriverSearch('');
                              setDebouncedDriverSearch('');
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Options list */}
                    <div className="max-h-56 overflow-y-auto p-1 space-y-1 custom-scrollbar">
                      {driversLoading || driversFetching ? (
                        <div className="py-6 text-center text-xs text-ink-4 flex items-center justify-center gap-2">
                          <Loader2 size={15} className="animate-spin text-primary" />
                          Searching drivers...
                        </div>
                      ) : filteredDriverOptions.length === 0 ? (
                        <div className="py-6 text-center text-xs text-ink-4">
                          {driverSearch.trim() ? `No drivers found matching "${driverSearch}"` : 'No drivers available'}
                        </div>
                      ) : (
                        filteredDriverOptions.map((d) => {
                          const isSelected = selectedDriver?.id === d.id || selectedDriver?._id === d.id;
                          return (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => {
                                setSelectedDriver(d);
                                setIsDriverDropdownOpen(false);
                                setDriverSearch('');
                                setDebouncedDriverSearch('');
                              }}
                              className={`w-full p-2.5 rounded-lg flex items-center justify-between gap-3 text-left transition-colors ${
                                isSelected
                                  ? 'bg-primary/10 text-primary'
                                  : 'hover:bg-bg text-ink'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Avatar initials={d.initials} size="sm" src={resolveMediaUrl(d.profile)} online={d.onDuty} />
                                <div className="min-w-0">
                                  <p className={`text-xs truncate ${isSelected ? 'font-semibold text-primary' : 'font-medium text-ink'}`}>
                                    {d.name}
                                  </p>
                                  <p className="text-[11px] text-ink-4 truncate">
                                    {d.phone || d.email || d.vehicle?.plate || 'Active Driver'}
                                  </p>
                                </div>
                              </div>
                              {isSelected && (
                                <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                                  <Check size={10} className="text-white" />
                                </div>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {!selectedDriver && (
                <p className="text-xs font-medium text-urgent px-1">A driver is required to create this booking</p>
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          <Card className="p-6 border-line-2 bg-white shadow-none">
            <SectionHeader title="5. Trip Configuration" icon={Activity} />
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-3">Trip Type</label>
                <div className="flex bg-bg p-1 rounded-lg border border-line-2">
                  {['one-way', 'round-trip'].map(t => (
                    <button key={t} type="button" onClick={() => setForm({ ...form, tripType: t as any })} className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${form.tripType === t ? 'bg-primary text-white shadow-md' : 'text-ink-4'}`}>
                      {t === 'one-way' ? 'One Way' : 'Round Trip'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-3">Trip Reason</label>
                <select className={inputClass} value={form.tripReason} onChange={e => setForm({ ...form, tripReason: e.target.value })}>
                  <option value="Medical Appointment">Medical Appointment</option>
                  <option value="Dialysis">Dialysis</option>
                  <option value="Chemotherapy">Chemotherapy</option>
                  <option value="Physical Therapy">Physical Therapy</option>
                  <option value="Hospital Discharge">Hospital Discharge</option>
                  <option value="Specialist Visit">Specialist Visit</option>
                  <option value="Routine Checkup">Routine Checkup</option>
                  <option value="Eye Exam">Eye Exam</option>
                  <option value="Dental">Dental</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between pt-5 border-t border-line-2 mt-5">
              <label className="text-xs font-medium text-ink-2">Passenger Seats</label>
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => setForm({ ...form, totalSeats: Math.max(1, form.totalSeats - 1) })} className="p-2 bg-white border border-line-2 rounded-lg hover:bg-bg"><Minus size={16} /></button>
                <span className="text-base font-semibold text-ink w-6 text-center">{form.totalSeats}</span>
                <button type="button" onClick={() => setForm({ ...form, totalSeats: form.totalSeats + 1 })} className="p-2 bg-white border border-line-2 rounded-lg hover:bg-bg"><Plus size={16} /></button>
              </div>
            </div>

            {/* Payer & Program Context */}
            <div className="pt-5 border-t border-line-2 mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-3">Payer <span className="text-urgent">*</span></label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
                  <select
                    required
                    className={`${inputClass} pl-8`}
                    value={form.payerSourceId}
                    onChange={e => {
                      const p = apiPayers.find(x => x._id === e.target.value);
                      const local = fundingPolicies.find(x => x.name === (p?.name || p?.title || p?.payerName));
                      setForm({
                        ...form,
                        payerSourceId: e.target.value,
                        fundingSource: p?.name || p?.title || p?.payerName || '',
                        fundingSourceId: local?.id || form.fundingSourceId,
                        manualFareOverride: false,
                      });
                    }}
                  >
                    {apiPayers.length === 0 && <option value="">No payers from API</option>}
                    {apiPayers.map(fs => (
                      <option key={fs._id} value={fs._id}>{fs.name || fs.title || fs.payerName || fs._id}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-3">Program Context</label>
                <div className="relative">
                  <Activity size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
                  <select className={`${inputClass} pl-8`} value={form.program} onChange={e => setForm({ ...form, program: e.target.value })}>
                    <option value="">Select program...</option>
                    <option value="Medicaid NEMT">Medicaid NEMT</option>
                    <option value="Senior Transport">Senior Transport</option>
                    <option value="DSS Medical">DSS Medical</option>
                    <option value="Adult Day Care">Adult Day Care</option>
                    <option value="Facility Discharge">Facility Discharge</option>
                    <option value="General Medical">General Medical</option>
                    <option value="Routine Dialysis">Routine Dialysis</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Inside / Outside County */}
            <div className="pt-5 border-t border-line-2 mt-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-ink-2">Inside service area</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium ${!form.insideCounty ? 'text-urgent' : 'text-ink-4'}`}>Outside</span>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, insideCounty: !form.insideCounty })}
                  className={`w-9 h-5 rounded-full relative transition-all ${form.insideCounty ? 'bg-accent' : 'bg-urgent/70'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${form.insideCounty ? 'right-0.5' : 'left-0.5'}`} />
                </button>
                <span className={`text-xs font-medium ${form.insideCounty ? 'text-accent' : 'text-ink-4'}`}>Inside</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-line-2 bg-white shadow-none !overflow-visible">
            <SectionHeader title="6. Service Scheduling" icon={Clock} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-3">Service Date(s)</label>
                <MultiDatePicker 
                  selected={selectedDates} 
                  onSelect={(days) => setSelectedDates(days || [])} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-3">Appt Time</label>
                <input
                  type="time"
                  required
                  className={timeInputClass('appointment')}
                  value={form.appointmentTime}
                  onChange={e => setForm({ ...form, appointmentTime: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-3">Pickup Time</label>
                <input
                  type="time"
                  required
                  className={timeInputClass('pickup')}
                  value={form.requestedPickup}
                  onChange={e => setForm({ ...form, requestedPickup: e.target.value })}
                />
              </div>
            </div>

            {(scheduleTimeValidation.errors.length > 0 || scheduleTimeValidation.warnings.length > 0) && (
              <div className="mt-4 space-y-2">
                {scheduleTimeValidation.errors.map((msg) => (
                  <div
                    key={msg}
                    className="flex items-start gap-2 rounded-xl border border-urgent/30 bg-urgent/5 px-3 py-2.5 text-xs text-urgent font-medium"
                  >
                    <Info size={14} className="shrink-0 mt-0.5" />
                    <span>{msg}</span>
                  </div>
                ))}
                {scheduleTimeValidation.warnings.map((msg) => (
                  <div
                    key={msg}
                    className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 px-3 py-2.5 text-xs text-ink font-medium"
                  >
                    <Info size={14} className="shrink-0 mt-0.5 text-warning" />
                    <span>{msg}</span>
                  </div>
                ))}
              </div>
            )}

            {form.tripType === 'round-trip' && (
              <div className="mt-6 pt-5 border-t border-line-2">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs font-medium text-ink-2">Return Time</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-ink-3">Will Call</span>
                    <button type="button" onClick={() => setForm({ ...form, isWillCall: !form.isWillCall })} className={`w-9 h-5 rounded-full relative transition-all ${form.isWillCall ? 'bg-primary' : 'bg-line-2'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${form.isWillCall ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>
                <input
                  type="time"
                  disabled={form.isWillCall}
                  className={form.isWillCall ? disabledInputClass : timeInputClass('return')}
                  value={form.isWillCall ? '' : form.returnPickup}
                  onChange={e => setForm({ ...form, returnPickup: e.target.value })}
                />
              </div>
            )}

            {/* Recurring Booking Option */}
            <div className="mt-6 pt-5 border-t border-line-2">
              <div className="flex justify-between items-center">
                <div className={`flex items-center gap-2 ${selectedDates.length > 1 ? 'opacity-50' : ''}`}>
                  <Repeat size={14} className={selectedDates.length > 1 ? 'text-ink-4' : 'text-primary'} />
                  <div>
                    <p className="text-xs font-medium text-ink-2">Recurring Booking</p>
                    <p className="text-xs font-medium text-ink-4">
                      {selectedDates.length > 1 
                        ? "Disabled because multiple custom dates are selected" 
                        : "Schedule repeating trips for dialysis, therapy, etc."}
                    </p>
                  </div>
                </div>
                <button 
                  type="button" 
                  disabled={selectedDates.length > 1}
                  onClick={() => setIsRecurring(!isRecurring)} 
                  className={`w-9 h-5 rounded-full relative transition-all ${selectedDates.length > 1 ? 'bg-line-2 cursor-not-allowed' : isRecurring ? 'bg-primary' : 'bg-line-2'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${isRecurring && selectedDates.length <= 1 ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>

              {isRecurring && selectedDates.length <= 1 && (
                <div className="mt-5 space-y-5 animate-in slide-in-from-top-2 duration-300">
                  {/* Select Days of the Week */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-ink-3">Select Days of the Week</label>
                    <div className="flex justify-between gap-1 bg-bg p-1.5 rounded-xl border border-line-2">
                      {[
                        { key: '1', short: 'Mon', label: 'M' },
                        { key: '2', short: 'Tue', label: 'T' },
                        { key: '3', short: 'Wed', label: 'W' },
                        { key: '4', short: 'Thu', label: 'T' },
                        { key: '5', short: 'Fri', label: 'F' },
                        { key: '6', short: 'Sat', label: 'S' },
                        { key: '0', short: 'Sun', label: 'S' }
                      ].map(day => {
                        const isSelected = recurringDays.includes(day.key);
                        return (
                          <button
                            key={day.key}
                            type="button"
                            onClick={() => {
                              setRecurringDays(prev => 
                                prev.includes(day.key) 
                                  ? prev.filter(k => k !== day.key) 
                                  : [...prev, day.key]
                              );
                            }}
                            className={`flex-1 aspect-square md:h-9 flex items-center justify-center text-xs font-medium rounded-lg transition-all ${isSelected ? 'bg-primary text-white shadow-md' : 'text-ink-4 hover:bg-white'}`}
                            title={day.short}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* End Date */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-ink-3">Repeat Until (End Date)</label>
                    <input 
                      type="date" 
                      min={selectedDates.length > 0 ? selectedDates[0].toISOString().split('T')[0] : ''} 
                      className={inputClass} 
                      value={recurringEndDate} 
                      onChange={e => setRecurringEndDate(e.target.value)} 
                    />
                  </div>

                  {/* Real-time schedule preview */}
                  {recurringDates.length > 0 && (
                    <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-primary">🗓️ Schedule Preview</span>
                        <Badge variant="primary" className="text-xs font-medium px-2 py-0.5">{recurringDates.length} Trips Total</Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                        {recurringDates.map((date, idx) => (
                          <span 
                            key={idx} 
                            className="bg-white border border-line-2 text-ink text-xs font-medium px-2 py-0.5 rounded-md shadow-sm whitespace-nowrap animate-in zoom-in-50 duration-200"
                          >
                            {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                        ))}
                      </div>
                      
                      <p className="text-xs text-ink-4 font-semibold italic">
                        * Recurring trips will be generated at the scheduled time of {form.requestedPickup || form.appointmentTime || 'N/A'} for each date above.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Custom Multi-Date Schedule Preview (when NOT recurring) */}
            {!isRecurring && selectedDates.length > 0 && (
              <div className="mt-6 pt-5 border-t border-line-2">
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-primary">🗓️ Selected Dates Preview</span>
                    <Badge variant="primary" className="text-xs font-medium px-2 py-0.5">{selectedDates.length} {selectedDates.length === 1 ? 'Trip' : 'Trips'} Total</Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                    {selectedDates.map((date, idx) => (
                      <span 
                        key={idx} 
                        className="flex items-center gap-1 bg-white border border-line-2 text-ink text-xs font-medium px-2 py-0.5 rounded-md shadow-sm whitespace-nowrap animate-in zoom-in-50 duration-200"
                      >
                        {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        <button 
                          type="button" 
                          onClick={() => setSelectedDates(selectedDates.filter(d => d.getTime() !== date.getTime()))} 
                          className="hover:bg-urgent/10 hover:text-urgent p-0.5 rounded-full transition-colors ml-0.5"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6 border-line-2 bg-bg/20 shadow-none">
            <SectionHeader title="8. Fare & Payment" icon={DollarSign} />
            {!calculatedPrice ? (
              <div className="py-6 flex flex-col items-center gap-3 text-center">
                <p className="text-xs text-ink-4 max-w-sm">
                  Calculate fare from pickup, dropoff, payer, mobility, and county coverage before dispatch.
                </p>
                <Button
                  type="button"
                  variant="primary"
                  disabled={!canCalculatePrice || isCalculatingPrice}
                  onClick={handleShowPrice}
                  icon={isCalculatingPrice ? Loader2 : DollarSign}
                  className="min-w-[160px]"
                >
                  {isCalculatingPrice ? 'Calculating...' : 'Show Price'}
                </Button>
                {!canCalculatePrice && (
                  <p className="text-xs font-medium text-ink-3">
                    Complete pickup, dropoff, payer, mobility, and ensure county coverage exists for the payer.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-ink-3">
                    {selectedPayerLabel} · {formatPriceMethodLabel(calculatedPrice.priceMethod)}
                  </span>
                  <Badge variant="bg" className="text-[11px] capitalize border border-line-2">
                    {calculatedPrice.zone} zone
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white p-4 rounded-2xl border border-line-2">
                    <p className="text-xs font-semibold text-ink-3 uppercase tracking-wide">Passenger Copay</p>
                    <p className="text-xs text-ink-4 mt-0.5">Zone copay {money(calculatedPrice.zoneCoPay)} · rider-facing</p>
                    <p className="text-2xl font-semibold text-ink mt-2">{money(passengerCopay)}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-primary/20 ring-1 ring-primary/10">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide">Payer Charge</p>
                    <p className="text-xs text-ink-4 mt-0.5">Organization contribution · admin</p>
                    <p className="text-2xl font-semibold text-primary mt-2">{money(payerCharge)}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-line-2 bg-white px-4 py-3 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-ink-4">Total trip price</span>
                    <span className="font-semibold text-ink">{money(calculatedPrice.totalPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-4">Mileage component</span>
                    <span className="font-medium text-ink">{money(calculatedPrice.milesPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-4">Mobility add-on</span>
                    <span className="font-medium text-ink">{money(calculatedPrice.mobilityTotalPrice)}</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-line-2 flex justify-between items-center shadow-sm">
                  <div>
                    <p className="text-xs font-medium text-ink-3">Due to Driver (from passenger copay)</p>
                    <p className="text-lg font-semibold text-ink">{money(dueToDriver)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-ink-4">Advance</p>
                      <div className="relative w-24">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-ink-3">$</span>
                        <input
                          type="number"
                          className="w-full pl-6 pr-2 py-1 bg-bg border border-line-2 rounded-lg text-sm text-right outline-none"
                          value={form.advancePaid}
                          onChange={e => setForm({ ...form, advancePaid: Number(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    <Badge variant={dueToDriver > 0 ? 'warning' : 'accent'} className="text-xs py-1.5 px-4 font-medium">
                      {dueToDriver > 0 ? 'Cash' : 'Paid'}
                    </Badge>
                  </div>
                </div>

                {isRecurring && recurringDates.length > 0 && (
                  <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl space-y-1">
                    <p className="text-xs font-medium text-primary">Recurring totals ({recurringDates.length} days)</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-ink-3">Passenger Copay</span>
                      <span className="font-semibold text-ink">{money(passengerCopay * recurringDates.length)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-ink-3">Payer Charge</span>
                      <span className="font-semibold text-primary">{money(payerCharge * recurringDates.length)}</span>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isCalculatingPrice}
                    onClick={handleShowPrice}
                  >
                    Recalculate
                  </Button>
                  <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-[200px]">
                    <input
                      type="checkbox"
                      checked={priceAgreed}
                      onChange={(e) => setPriceAgreed(e.target.checked)}
                      className="rounded border-line-2 text-primary focus:ring-primary/20"
                    />
                    <span className="text-xs font-semibold text-ink-3">I agree with this quoted price</span>
                  </label>
                </div>
              </div>
            )}
          </Card>

          <Button
            variant="primary"
            type="submit"
            disabled={isCreating || !calculatedPrice || !priceAgreed || scheduleHasErrors}
            className="w-full py-4 text-sm font-medium shadow-lg shadow-primary/10 transition-all"
            icon={ArrowRight}
          >
            {isCreating ? 'Creating booking...' : 'Complete & Dispatch'}
          </Button>
        </div>
      </form>
    </div>
  );
}
