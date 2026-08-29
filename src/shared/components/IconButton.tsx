// // components/IconButton.tsx
// import { Pressable, type PressableProps } from 'react-native';
// import { hitSlop } from '../utils/hitSlop';
// import { tokens } from '../shared/theme/tokens';
// import { cn } from '../utils/cn';

// type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// const iconSizeMap: Record<IconSize, number> = {
//     xs: tokens.sizes.iconXs,   // 12
//     sm: tokens.sizes.iconSm,   // 16
//     md: tokens.sizes.iconMd,   // 20
//     lg: tokens.sizes.iconLg,   // 24
//     xl: tokens.sizes.iconXl,   // 32
// };

// type Props = PressableProps & {
//     icon: React.ReactNode;
//     size?: IconSize;
//     className?: string;
// };

// export const IconButton = ({
//     icon,
//     size = 'lg',        // 24px default
//     className,
//     ...props
// }: Props) => {
//     const px = iconSizeMap[size];

//     return (
//         <Pressable
//             hitSlop={hitSlop.icon(px)}   // ← auto-calculated from token
//             className={cn(
//                 "items-center justify-center active:opacity-60",
//                 className,
//             )}
//             {...props}
//         >
//             {icon}
//         </Pressable>
//     );
// };