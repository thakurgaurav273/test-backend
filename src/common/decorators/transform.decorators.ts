import { Transform } from 'class-transformer';

/** Trims string input; leaves other types for the validators to reject. */
export const Trim = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );

/** Lower-cases and trims, for emails and slugs. */
export const TrimLower = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  );

/** Query strings arrive as text: "true"/"1" become true, "false"/"0" become false. */
export const ToBoolean = () =>
  Transform(({ value }: { value: unknown }) => {
    if (value === 'true' || value === '1' || value === true) return true;
    if (value === 'false' || value === '0' || value === false) return false;
    return value;
  });

/** Trims each entry of a string array and drops empty ones. */
export const TrimArray = () =>
  Transform(({ value }: { value: unknown }) =>
    Array.isArray(value)
      ? value
          .map((item: unknown) =>
            typeof item === 'string' ? item.trim() : item,
          )
          .filter((item) => item !== '')
      : value,
  );
