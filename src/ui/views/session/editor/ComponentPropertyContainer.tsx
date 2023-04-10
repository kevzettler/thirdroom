import { ComponentPropertyInfo, ComponentPropertyType } from "../../../../engine/component/types";
import { VectorInput } from "../../components/property-panel/VectorInput";
import { Label } from "../../../atoms/text/Label";
import { useComponentProperty } from "../../../hooks/useComponentProperty";

export function ComponentPropertyContainer({ id, name, type }: ComponentPropertyInfo) {
  const { value, onChange } = useComponentProperty<typeof type>(id);

  if (type === ComponentPropertyType.Vector3 && value) {
    return (
      <div className="flex flex-column gap-xxs">
        <Label className="shrink-0">{name}:</Label>
        <VectorInput type="vec3" value={value as Float32Array} onChange={onChange} />
      </div>
    );
  } else {
    return <div>{name}</div>;
  }
}
