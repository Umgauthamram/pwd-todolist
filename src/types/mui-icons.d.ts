declare module "@mui/icons-material" {
  import { SvgIconComponent } from "@mui/material";

  export const Menu: SvgIconComponent;
  export const Search: SvgIconComponent;
  export const Refresh: SvgIconComponent;
  export const ViewStream: SvgIconComponent;
  export const GridView: SvgIconComponent;
  export const SettingsOutlined: SvgIconComponent;
  export const LightbulbOutlined: SvgIconComponent;
  export const LockOutlined: SvgIconComponent;
  export const ArchiveOutlined: SvgIconComponent;
  export const DeleteOutline: SvgIconComponent;
  export const DeleteOutlined: SvgIconComponent;
  export const CheckBoxOutlined: SvgIconComponent;
  export const BrushOutlined: SvgIconComponent;
  export const ImageOutlined: SvgIconComponent;
  export const PushPin: SvgIconComponent;
  export const PushPinOutlined: SvgIconComponent;
  export const UnarchiveOutlined: SvgIconComponent;
  export const Check: SvgIconComponent;
  export const CheckCircle: SvgIconComponent;
  export const Storage: SvgIconComponent;
  export const EmailOutlined: SvgIconComponent;
  export const SecurityOutlined: SvgIconComponent;
  export const Visibility: SvgIconComponent;
  export const VisibilityOff: SvgIconComponent;
  export const VpnKey: SvgIconComponent;
  export const ContentCopy: SvgIconComponent;
  export const PaletteOutlined: SvgIconComponent;
  export const LabelOutlined: SvgIconComponent;
  export const MoreVert: SvgIconComponent;
  export const Close: SvgIconComponent;
  export const Add: SvgIconComponent;
  export const EditOutlined: SvgIconComponent;
  export const RestoreFromTrash: SvgIconComponent;
  export const DeleteForever: SvgIconComponent;
  export const ArrowBack: SvgIconComponent;
  export const Logout: SvgIconComponent;
  export const Person: SvgIconComponent;

  const icons: Record<string, SvgIconComponent>;
  export default icons;
}

declare module "@mui/icons-material/*" {
  import { SvgIconComponent } from "@mui/material";
  const icon: SvgIconComponent;
  export default icon;
}
