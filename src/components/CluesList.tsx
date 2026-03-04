import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import type { Clue } from '../types/crossword';

const COLORS = {
  background: '#1a1f3c',
  surface: '#252b4a',
  accent: '#f5c518',
  textPrimary: '#ffffff',
  textSecondary: '#a0aec0',
  border: '#4a5568',
  activeClue: '#f5c518',
  activeClueText: '#1a1f3c',
};

interface CluesListProps {
  acrossClues: Clue[];
  downClues: Clue[];
  activeClueId: string | null;
  onCluePress: (clue: Clue) => void;
}

export const CluesList: React.FC<CluesListProps> = ({
  acrossClues,
  downClues,
  activeClueId,
  onCluePress,
}) => {
  const [activeTab, setActiveTab] = useState<'across' | 'down'>('across');
  const flatListRef = useRef<FlatList>(null);

  const clues = activeTab === 'across' ? acrossClues : downClues;

  // Switch to tab containing active clue and scroll to it
  useEffect(() => {
    if (!activeClueId) return;
    const isAcross = activeClueId.endsWith('-across');
    const isDown = activeClueId.endsWith('-down');
    if (isAcross && activeTab !== 'across') setActiveTab('across');
    else if (isDown && activeTab !== 'down') setActiveTab('down');
  }, [activeClueId]);

  useEffect(() => {
    if (!activeClueId || !flatListRef.current) return;
    const list = activeTab === 'across' ? acrossClues : downClues;
    const index = list.findIndex(c => c.id === activeClueId);
    if (index >= 0) {
      flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.4 });
    }
  }, [activeClueId, activeTab]);

  const renderClue = ({ item }: { item: Clue }) => {
    const isActive = item.id === activeClueId;
    return (
      <TouchableOpacity
        onPress={() => onCluePress(item)}
        style={[styles.clueItem, isActive && styles.clueItemActive]}
        activeOpacity={0.7}
      >
        <View style={styles.clueNumber}>
          <Text style={[styles.clueNumberText, isActive && styles.clueActiveText]}>
            {item.number}
          </Text>
        </View>
        <Text
          style={[styles.clueText, isActive && styles.clueActiveText]}
          numberOfLines={2}
        >
          {item.text}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'across' && styles.tabActive]}
          onPress={() => setActiveTab('across')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'across' && styles.tabTextActive]}>
            Across
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'down' && styles.tabActive]}
          onPress={() => setActiveTab('down')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'down' && styles.tabTextActive]}>
            Down
          </Text>
        </TouchableOpacity>
      </View>

      {/* Clues */}
      <FlatList
        ref={flatListRef}
        data={clues}
        keyExtractor={(item) => item.id}
        renderItem={renderClue}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onScrollToIndexFailed={() => {}}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.accent,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 4,
  },
  clueItem: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'flex-start',
  },
  clueItemActive: {
    backgroundColor: COLORS.activeClue,
  },
  clueNumber: {
    width: 28,
    alignItems: 'center',
    marginRight: 8,
  },
  clueNumberText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  clueText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
  clueActiveText: {
    color: COLORS.activeClueText,
  },
});
