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
  showScoreLabel?: boolean;
}

const RATING_LABELS: Record<number, string> = {
  1: '1.0 - Needs Work',
  2: '2.0 - Fair',
  3: '3.0 - Good',
  4: '4.0 - Very Good',
  5: '5.0 - Excellent',
};

export const Rating: React.FC<RatingProps> = ({
  rating,
  maxRating = 5,
  count,
  size = 14,
  interactive = false,
  onRatingChange,
  showScoreLabel = false,
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
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                onPress={() => onRatingChange?.(starValue)}
                style={[styles.starTouch, interactive && styles.starTouchInteractive]}
              >
                {StarIcon}
              </TouchableOpacity>
            );
          }

          return (
            <View key={index} style={styles.starTouch}>
              {StarIcon}
            </View>
          );
        })}
      </View>

      {!interactive && (
        <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
          {rating.toFixed(1)} {count !== undefined && `(${count})`}
        </Text>
      )}

      {interactive && showScoreLabel && (
        <Text style={[styles.ratingScoreLabel, { color: palette.warning }]}>
          {RATING_LABELS[Math.round(rating)] || `${rating.toFixed(1)} Stars`}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starTouch: {
    marginRight: 2,
  },
  starTouchInteractive: {
    marginRight: spacing.xs,
    padding: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  ratingScoreLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: spacing.xs,
  },
});
