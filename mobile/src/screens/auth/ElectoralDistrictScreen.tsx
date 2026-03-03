import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Polygon, type Region } from 'react-native-maps';
import type { StackScreenProps } from '@react-navigation/stack';
import type { AuthStackParamList } from '../../types';
import Ionicons from '../../components/Icon';
import AppLogo from '../../components/AppLogo';
import GradientBackground from '../../components/GradientBackground';
import { theme } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import {
  geocodeAddress,
} from '../../services/geoService';
import {
  findLocalDistrictByPoint,
  getLocalDistrictFeature,
  listLocalDistricts,
  type LocalDistrictSummary,
} from '../../services/localDistricts';

type ElectoralDistrictProps = StackScreenProps<AuthStackParamList, 'ElectoralDistrict'>;

type MapPolygon = {
  id: string;
  coordinates: { latitude: number; longitude: number }[];
};

type SelectedDistrict = {
  name: string;
  id?: string;
  source: 'geo' | 'manual';
};

const DEFAULT_REGION: Region = {
  latitude: 56.1304,
  longitude: -106.3468,
  latitudeDelta: 40,
  longitudeDelta: 50,
};

const toSearchable = (value: unknown): string => String(value ?? '').toLowerCase();

const ElectoralDistrictScreen: React.FC<ElectoralDistrictProps> = ({ navigation, route }) => {
  const { completeOnboarding } = useAuth();
  const [addressQuery, setAddressQuery] = useState('');
  const [manualQuery, setManualQuery] = useState('');
  const [district, setDistrict] = useState<SelectedDistrict | null>(null);
  const [polygons, setPolygons] = useState<MapPolygon[]>([]);
  const [mapRegion, setMapRegion] = useState<Region>(DEFAULT_REGION);
  const [point, setPoint] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const districtOptions = useMemo(() => listLocalDistricts(), []);

  const filteredBoundaries = useMemo(() => {
    const term = manualQuery.trim().toLowerCase();
    if (!term || districtOptions.length === 0) return [];
    return districtOptions
      .filter((district) => {
        const name = toSearchable(district.name);
        const externalId = toSearchable(district.id);
        return name.includes(term) || externalId.includes(term);
      })
      .slice(0, 6);
  }, [manualQuery, districtOptions]);

  const updateMapFromShape = (shape: unknown): MapPolygon[] => {
    const mapPolygons = geojsonToPolygons(shape).filter(
      (poly) => poly.coordinates.length >= 3
    );
    setPolygons(mapPolygons);
    const region = getRegionForPolygons(mapPolygons);
    if (region) {
      setMapRegion(region);
    }
    return mapPolygons;
  };

  const handleLookup = async () => {
    setError(null);
    const query = addressQuery.trim();
    if (!query) {
      setError('Enter a street address or postal code.');
      return;
    }
    if (districtOptions.length === 0) {
      setError('District boundary data is missing. Please install the data file first.');
      return;
    }
    setIsSearching(true);
    try {
      const geo = await geocodeAddress(query);
      const geoPoint = { latitude: geo.lat, longitude: geo.lng };
      setPoint(geoPoint);

      const match = findLocalDistrictByPoint(geo.lat, geo.lng);
      if (!match) {
        throw new Error('No district matched');
      }

      const feature = match.feature;
      const mapPolys = updateMapFromShape(feature.geometry);
      setDistrict({
        name: feature.properties?.name || 'Unknown district',
        id: feature.properties?.id != null ? String(feature.properties.id) : undefined,
        source: 'geo',
      });
      if (!mapPolys || mapPolys.length === 0) {
        setMapRegion({
          latitude: geoPoint.latitude,
          longitude: geoPoint.longitude,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        });
      }
    } catch (err) {
      const details = getErrorDetails(err);
      setError(
        details ? `Unable to locate a district. ${details}` : 'Unable to locate a district from that location.'
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectBoundary = async (boundary: LocalDistrictSummary) => {
    setError(null);
    setDistrict({
      name: boundary.name || 'Unknown district',
      id: boundary.id != null ? String(boundary.id) : undefined,
      source: 'manual',
    });
    setManualQuery(boundary.name || '');
    setIsSearching(true);
    try {
      const feature = getLocalDistrictFeature(boundary.index);
      if (!feature) {
        throw new Error('District not found');
      }
      updateMapFromShape(feature.geometry);
    } catch (err) {
      setError('District selected, but map could not be loaded.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleUseManualEntry = () => {
    const trimmed = manualQuery.trim();
    if (!trimmed) {
      setError('Enter the district name first.');
      return;
    }
    setDistrict({ name: trimmed, source: 'manual' });
  };

  const handleContinue = async () => {
    setError(null);
    const updatedDemographics = { ...route.params.demographics };
    if (district?.name) {
      updatedDemographics.electoral_district = district.name;
    }
    if (district?.id) {
      updatedDemographics.electoral_district_id = district.id;
    }
    
    // Call completeOnboarding with both demographics and interests
    const result = await completeOnboarding(
      updatedDemographics,
      route.params.interests
    );
    
    if (!result.ok && result.error) {
      setError(result.error);
    }
  };

  return (
    <View style={styles.container}>
      <GradientBackground style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <AppLogo width={90} height={90} />
      </GradientBackground>

      <ScrollView style={styles.card} contentContainerStyle={styles.cardContent}>
        <Text style={styles.title}>Find Your Electoral District</Text>
        <Text style={styles.subtitle}>
          Search by address or postal code. We only store your district, not your location.
        </Text>
        {districtOptions.length === 0 ? (
          <Text style={styles.noticeText}>
            District boundary data is not installed. Run the boundary builder script to enable lookup.
          </Text>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.label}>Address or postal code</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 111 Wellington St, Ottawa OR K1A 0A9"
            placeholderTextColor="#9b9b9b"
            value={addressQuery}
            onChangeText={setAddressQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.primaryButton} onPress={handleLookup} disabled={isSearching}>
            {isSearching ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Search District</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Know your district already?</Text>
          <TextInput
            style={styles.input}
            placeholder="Type the district name"
            placeholderTextColor="#9b9b9b"
            value={manualQuery}
            onChangeText={setManualQuery}
            autoCapitalize="words"
          />

          {filteredBoundaries.length > 0 ? (
            <View style={styles.matchList}>
              {filteredBoundaries.map((boundary) => (
                <TouchableOpacity
                  key={`${boundary.id || boundary.name}-${boundary.index}`}
                  style={styles.matchRow}
                  onPress={() => handleSelectBoundary(boundary)}
                >
                  <Text style={styles.matchText}>{boundary.name}</Text>
                  {boundary.id ? (
                    <Text style={styles.matchSubtext}>#{boundary.id}</Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <TouchableOpacity style={styles.secondaryButton} onPress={handleUseManualEntry}>
            <Text style={styles.secondaryButtonText}>Use Typed District Name</Text>
          </TouchableOpacity>
        </View>

        {district ? (
          <View style={styles.section}>
            <Text style={styles.label}>Selected district</Text>
            <View style={styles.districtRow}>
              <Text style={styles.districtName}>{district.name}</Text>
              {district.id ? <Text style={styles.districtMeta}>#{district.id}</Text> : null}
            </View>
          </View>
        ) : null}

        {polygons.length > 0 ? (
          <View style={styles.mapWrapper}>
            <MapView style={styles.map} region={mapRegion}>
              {polygons.map((poly) => (
                <Polygon
                  key={poly.id}
                  coordinates={poly.coordinates}
                  strokeWidth={2}
                  strokeColor={theme.colors.accent}
                  fillColor={`${theme.colors.accent}33`}
                />
              ))}
              {point ? <Marker coordinate={point} /> : null}
            </MapView>
          </View>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={styles.primaryButton} onPress={handleContinue}>
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => Linking.openURL('https://www.elections.ca/map_01.aspx?lang=e&section=res&w=0')}
        >
          <Text style={styles.linkText}>View official Elections Canada map</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const getErrorDetails = (err: unknown): string | null => {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const statusText = err.response?.statusText;
    const url = err.config?.url;
    const serviceHint = url
      ? url.includes('represent.opennorth.ca')
        ? 'Boundary service'
        : url.includes('nominatim.openstreetmap.org')
          ? 'Geocoder'
          : 'Request'
      : 'Request';
    if (status) {
      return `${serviceHint} error: HTTP ${status}${statusText ? ` ${statusText}` : ''}.`;
    }
    if (err.message) {
      return err.message;
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return null;
};

const geojsonToPolygons = (geojson: unknown): MapPolygon[] => {
  if (!geojson || typeof geojson !== 'object') return [];
  const anyGeo = geojson as { type?: string; geometry?: unknown; features?: unknown[] };
  if (anyGeo.type === 'Feature' && anyGeo.geometry) {
    return geometryToPolygons(anyGeo.geometry);
  }
  if (anyGeo.type === 'FeatureCollection' && Array.isArray(anyGeo.features)) {
    const polygons: MapPolygon[] = [];
    anyGeo.features.forEach((feature, index) => {
      const geo = feature as { geometry?: unknown };
      if (geo.geometry) {
        polygons.push(...geometryToPolygons(geo.geometry, `feature-${index}`));
      }
    });
    return polygons;
  }
  return geometryToPolygons(anyGeo);
};

const geometryToPolygons = (geometry: unknown, prefix = 'poly'): MapPolygon[] => {
  if (!geometry || typeof geometry !== 'object') return [];
  const geo = geometry as {
    type?: string;
    coordinates?: number[][] | number[][][] | number[][][][];
  };
  if (geo.type === 'Polygon' && Array.isArray(geo.coordinates)) {
    const outerRing = geo.coordinates[0] || [];
    return [
      {
        id: `${prefix}-0`,
        coordinates: outerRing.map((coord) => ({
          longitude: Number(coord[0]),
          latitude: Number(coord[1]),
        })),
      },
    ];
  }
  if (geo.type === 'MultiPolygon' && Array.isArray(geo.coordinates)) {
    return geo.coordinates.map((polygon, index) => {
      const outerRing = polygon[0] || [];
      return {
        id: `${prefix}-${index}`,
        coordinates: outerRing.map((coord) => ({
          longitude: Number(coord[0]),
          latitude: Number(coord[1]),
        })),
      };
    });
  }
  return [];
};

const getRegionForPolygons = (polygons: MapPolygon[]): Region | null => {
  let minLat = Number.POSITIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  let minLng = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;

  polygons.forEach((poly) => {
    poly.coordinates.forEach((coord) => {
      minLat = Math.min(minLat, coord.latitude);
      maxLat = Math.max(maxLat, coord.latitude);
      minLng = Math.min(minLng, coord.longitude);
      maxLng = Math.max(maxLng, coord.longitude);
    });
  });

  if (!Number.isFinite(minLat) || !Number.isFinite(minLng)) return null;

  const latitude = (minLat + maxLat) / 2;
  const longitude = (minLng + maxLng) / 2;
  const latitudeDelta = Math.max(0.05, (maxLat - minLat) * 1.4);
  const longitudeDelta = Math.max(0.05, (maxLng - minLng) * 1.4);

  return { latitude, longitude, latitudeDelta, longitudeDelta };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: 56,
    paddingBottom: 24,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 56,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -12,
  },
  cardContent: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textDark,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 16,
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  noticeText: {
    marginBottom: 16,
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.colors.textDark,
    backgroundColor: theme.colors.surface,
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: theme.colors.black,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.textDark,
    fontSize: 14,
    fontWeight: '600',
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  helperText: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  matchList: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  matchRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  matchText: {
    fontSize: 14,
    color: theme.colors.textDark,
    fontWeight: '600',
  },
  matchSubtext: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  districtRow: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceMuted,
  },
  districtName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textDark,
  },
  districtMeta: {
    marginTop: 4,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  mapWrapper: {
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    marginBottom: 16,
  },
  map: {
    flex: 1,
  },
  errorText: {
    marginTop: 12,
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  linkButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  linkText: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
});

export default ElectoralDistrictScreen;
