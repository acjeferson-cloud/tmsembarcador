import { supabase } from '../lib/supabase';
import { acreCities } from '../data/acre-cities';

const cleanZipCode = (zip: string): string => {
  return zip.replace(/\D/g, '');
};

export async function importAcreCities() {
  if (!supabase) {
    return { success: false, error: 'Supabase client not available' };
  }

  try {
    for (const city of acreCities) {
      const { id, zipCodeRanges, ...cityData } = city;

      const { data: existingCity, error: checkError } = await supabase
        .from('cities')
        .select('id')
        .eq('ibge_code', cityData.ibgeCode)
        .maybeSingle();

      if (checkError) {
        continue;
      }

      let cityId: string;

      if (existingCity) {
        const { data: updatedCity, error: updateError } = await supabase
          .from('cities')
          .update({
            name: cityData.name,
            state_name: cityData.stateName,
            state_abbreviation: cityData.stateAbbreviation,
            zip_code_start: cleanZipCode(cityData.zipCodeStart),
            zip_code_end: cleanZipCode(cityData.zipCodeEnd),
            type: cityData.type,
            region: cityData.region,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingCity.id)
          .select('id')
          .single();

        if (updateError) {
          continue;
        }

        cityId = updatedCity.id;
      } else {
        const { data: newCity, error: insertError } = await supabase
          .from('cities')
          .insert({
            name: cityData.name,
            ibge_code: cityData.ibgeCode,
            state_name: cityData.stateName,
            state_abbreviation: cityData.stateAbbreviation,
            zip_code_start: cleanZipCode(cityData.zipCodeStart),
            zip_code_end: cleanZipCode(cityData.zipCodeEnd),
            type: cityData.type,
            region: cityData.region
          })
          .select('id')
          .single();

        if (insertError) {
          continue;
        }

        cityId = newCity.id;
      }

      if (zipCodeRanges && zipCodeRanges.length > 0) {
        const { error: deleteError } = await supabase
          .from('zip_code_ranges')
          .delete()
          .eq('city_id', cityId);

        if (deleteError) {
          continue;
        }

        const zipRangesToInsert = zipCodeRanges.map(range => ({
          city_id: cityId,
          start_zip: cleanZipCode(range.start),
          end_zip: cleanZipCode(range.end),
          area: range.area || null,
          neighborhood: range.neighborhood || null
        }));

        const { error: rangeError } = await supabase
          .from('zip_code_ranges')
          .insert(zipRangesToInsert);

        if (rangeError) {
          continue;
        }
      } else {
      }
    }
    return { success: true, message: `Imported ${acreCities.length} cities from Acre` };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
