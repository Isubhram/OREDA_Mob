import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, DimensionValue } from 'react-native';

export type SkeletonVariant = 'text' | 'card' | 'circle' | 'rectangle';

export interface SkeletonLoaderProps {
    variant?: SkeletonVariant;
    width?: number | string;
    height?: number | string;
    borderRadius?: number;
    style?: ViewStyle;
    count?: number; // Number of skeleton items to render
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
    variant = 'rectangle',
    width = '100%',
    height,
    borderRadius,
    style,
    count = 1,
}) => {
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Create shimmer animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [animatedValue]);

    // Interpolate opacity for shimmer effect
    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    // Get default dimensions based on variant
    const getDefaultDimensions = (): { width: DimensionValue; height: number; borderRadius: number } => {
        switch (variant) {
            case 'text':
                return { width: width as DimensionValue || '80%', height: (height as number) || 16, borderRadius: borderRadius || 4 };
            case 'card':
                return { width: (width as DimensionValue) || '100%', height: (height as number) || 120, borderRadius: borderRadius || 8 };
            case 'circle':
                const size = (height as number) || 50;
                return { width: size, height: size, borderRadius: size / 2 };
            case 'rectangle':
            default:
                return { width: (width as DimensionValue) || '100%', height: (height as number) || 100, borderRadius: borderRadius || 8 };
        }
    };

    const dimensions = getDefaultDimensions();

    // Render multiple skeleton items if count > 1
    const renderSkeletons = () => {
        const skeletons = [];
        for (let i = 0; i < count; i++) {
            skeletons.push(
                <Animated.View
                    key={i}
                    style={[
                        styles.skeleton,
                        {
                            width: dimensions.width,
                            height: dimensions.height,
                            borderRadius: dimensions.borderRadius,
                        },
                        { opacity },
                        style,
                        count > 1 && i < count - 1 && styles.skeletonMargin,
                    ]}
                />
            );
        }
        return skeletons;
    };

    return <View style={styles.container}>{renderSkeletons()}</View>;
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
    },
    skeleton: {
        backgroundColor: '#E1E9EE',
    },
    skeletonMargin: {
        marginBottom: 10,
    },
});

export default SkeletonLoader;

