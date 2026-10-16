import { ACCESS_GROUPS, accessLabel, type WorkboardAccess } from '../utils/workboardAccess';

export default function AccessChecks({
  value,
  onChange,
}: {
  value: WorkboardAccess;
  onChange: (next: WorkboardAccess) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
      {ACCESS_GROUPS.map(group => (
        <div key={group.title} className="border border-gray-200 rounded-lg p-2 bg-white">
          <div className="text-[10px] font-bold text-gray-800 mb-1">{group.title}</div>
          {group.keys.map(key => (
            <label key={key} className="flex items-center gap-2 text-[11px] text-gray-700 py-0.5 cursor-pointer">
              <input
                type="checkbox"
                checked={!!value[key]}
                onChange={event => onChange({ ...value, [key]: event.target.checked, board_create: false })}
              />
              {accessLabel(key)}
            </label>
          ))}
        </div>
      ))}
    </div>
  );
}
