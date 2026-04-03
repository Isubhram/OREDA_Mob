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
            if (variant === 'card') {
                skeletons.push(
                    <View key={i} style={[styles.cardWrapper, count > 1 && i < count - 1 && styles.skeletonMargin, style]}>
                        <Animated.View style={[styles.skeleton, styles.cardAccentLoader, { opacity }]} />
                        <View style={styles.cardBody}>
                            <View style={styles.cardTopRow}>
                                <Animated.View style={[styles.skeleton, { width: 80, height: 14, borderRadius: 4, opacity }]} />
                                <Animated.View style={[styles.skeleton, { width: 60, height: 20, borderRadius: 10, opacity }]} />
                            </View>
                            <Animated.View style={[styles.skeleton, { width: '85%', height: 16, borderRadius: 4, opacity, marginBottom: 8 }]} />
                            <Animated.View style={[styles.skeleton, { width: '60%', height: 16, borderRadius: 4, opacity, marginBottom: 12 }]} />
                            <View style={styles.cardMetaRow}>
                                <Animated.View style={[styles.skeleton, { width: 100, height: 14, borderRadius: 4, opacity }]} />
                                <Animated.View style={[styles.skeleton, { width: 100, height: 14, borderRadius: 4, opacity }]} />
                            </View>
                            <View style={styles.cardFooterLoader}>
                                <Animated.View style={[styles.skeleton, { width: 70, height: 20, borderRadius: 8, opacity }]} />
                                <Animated.View style={[styles.skeleton, { width: 30, height: 14, borderRadius: 4, opacity }]} />
                            </View>
                        </View>
                    </View>
                );
            } else {
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
        backgroundColor: '#cbd5e1',
    },
    skeletonMargin: {
        marginBottom: 10,
    },
    cardWrapper: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 10,
        flexDirection: 'row',
        overflow: 'hidden',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        height: 140,
    },
    cardAccentLoader: {
        width: 4,
    },
    cardBody: {
        flex: 1,
        padding: 12,
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    cardFooterLoader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 8,
        marginTop: 'auto',
    },
});

export default SkeletonLoader;

