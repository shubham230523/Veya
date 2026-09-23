import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { useTheme, spacing, palette } from '../../core/theme';

export interface RatingProps {
  rating: number;
  maxRating?: number;
  count?: number;
  size?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

export const Rating: React.FC<RatingProps> = ({
  rating,
  maxRating = 5,
  count,
  size = 14,
  interactive = false,
  onRatingChange,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.starsRow}>
        {Array.from({ length: maxRating }).map((_, index) => {
          const starValue = index + 1;
          const isFilled = rating >= starValue;
          const isHalf = rating >= starValue - 0.5 && rating < starValue;

          const StarIcon = (
            <Star
              key={index}
              color={isFilled || isHalf ? palette.warning : colors.textMuted}
              fill={isFilled ? palette.warning : 'transparent'}
              size={size}
            />
          );

          if (interactive) {
            return (
              <TouchableOpacity
                key={index}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                onPress={() => onRatingChange?.(starValue)}
                style={styles.starTouch}
              >
                {StarIcon}
              </TouchableOpacity>
            );
          }

          return <View key={index} style={styles.starTouch}>{StarIcon}</View>;
        })}
      </View>
      {!interactive && (
        <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
          {rating.toFixed(1)} {count !== undefined && `(${count})`}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starTouch: {
    marginRight: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
});
