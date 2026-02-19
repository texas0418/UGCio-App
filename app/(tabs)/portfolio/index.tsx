import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  TextInput,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Plus, X, ImageIcon } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useCreator } from "@/contexts/CreatorContext";
import { NICHE_CATEGORIES } from "@/mocks/categories";
import { PortfolioItem } from "@/types";

const SCREEN_WIDTH = Dimensions.get("window").width;
const GRID_GAP = 2;
const ITEM_SIZE = (SCREEN_WIDTH - 40 - GRID_GAP * 2) / 3;

export default function PortfolioScreen() {
  const { portfolio, addPortfolioItem, removePortfolioItem } = useCreator();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [newItem, setNewItem] = useState({
    uri: "",
    category: "",
    brandName: "",
    description: "",
  });

  const categories = [
    "All",
    ...Array.from(new Set(portfolio.map((p) => p.category))),
  ];

  const filtered =
    selectedCategory === "All"
      ? portfolio
      : portfolio.filter((p) => p.category === selectedCategory);

  const pickMedia = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setNewItem((prev) => ({ ...prev, uri: result.assets[0].uri }));
    }
  }, []);

  const handleAdd = useCallback(() => {
    if (!newItem.uri) {
      Alert.alert("Missing Image", "Please select an image first.");
      return;
    }
    if (!newItem.category) {
      Alert.alert("Missing Category", "Please select a category.");
      return;
    }

    const item: PortfolioItem = {
      id: Date.now().toString(),
      type: "photo",
      uri: newItem.uri,
      category: newItem.category,
      brandName: newItem.brandName || undefined,
      description: newItem.description || undefined,
      createdAt: new Date().toISOString(),
    };

    addPortfolioItem(item);
    setNewItem({ uri: "", category: "", brandName: "", description: "" });
    setShowAddForm(false);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [newItem, addPortfolioItem]);

  const confirmRemove = useCallback(
    (id: string) => {
      Alert.alert("Remove Item", "Remove this from your portfolio?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            removePortfolioItem(id);
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
          },
        },
      ]);
    },
    [removePortfolioItem]
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterChip,
                selectedCategory === cat && styles.filterChipActive,
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === cat && styles.filterChipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {showAddForm && (
          <View style={styles.addForm}>
            <View style={styles.addFormHeader}>
              <Text style={styles.addFormTitle}>New Work</Text>
              <TouchableOpacity
                onPress={() => setShowAddForm(false)}
                style={styles.closeBtn}
              >
                <X size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.mediaPicker}
              onPress={pickMedia}
              activeOpacity={0.8}
            >
              {newItem.uri ? (
                <Image
                  source={{ uri: newItem.uri }}
                  style={styles.mediaPreview}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.mediaPlaceholder}>
                  <ImageIcon size={28} color={Colors.textTertiary} />
                  <Text style={styles.mediaPlaceholderText}>
                    Tap to select image
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryPicker}
            >
              {NICHE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catChip,
                    newItem.category === cat && styles.catChipActive,
                  ]}
                  onPress={() =>
                    setNewItem((prev) => ({ ...prev, category: cat }))
                  }
                >
                  <Text
                    style={[
                      styles.catChipText,
                      newItem.category === cat && styles.catChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Brand Name (optional)</Text>
            <TextInput
              style={styles.input}
              value={newItem.brandName}
              onChangeText={(t) =>
                setNewItem((prev) => ({ ...prev, brandName: t }))
              }
              placeholder="e.g. Nike, Glossier..."
              placeholderTextColor={Colors.textTertiary}
            />

            <Text style={styles.fieldLabel}>Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.descInput]}
              value={newItem.description}
              onChangeText={(t) =>
                setNewItem((prev) => ({ ...prev, description: t }))
              }
              placeholder="Brief description of this work..."
              placeholderTextColor={Colors.textTertiary}
              multiline
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleAdd}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>Add to Portfolio</Text>
            </TouchableOpacity>
          </View>
        )}

        {filtered.length > 0 ? (
          <View style={styles.grid}>
            {filtered.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.gridItem}
                onLongPress={() => confirmRemove(item.id)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: item.uri }}
                  style={styles.gridImage}
                  contentFit="cover"
                />
                {item.brandName && (
                  <View style={styles.brandBadge}>
                    <Text style={styles.brandBadgeText} numberOfLines={1}>
                      {item.brandName}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <ImageIcon size={36} color={Colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No work yet</Text>
            <Text style={styles.emptySubtitle}>
              Add your best UGC content to showcase to brands
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {!showAddForm && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowAddForm(true)}
          activeOpacity={0.85}
          testID="add-portfolio-btn"
        >
          <Plus size={22} color={Colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
  },
  filterRow: {
    gap: 8,
    paddingBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500" as const,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  addForm: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addFormHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  addFormTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  mediaPicker: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  mediaPreview: {
    width: "100%",
    height: "100%",
  },
  mediaPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: "dashed",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  mediaPlaceholderText: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  categoryPicker: {
    flexGrow: 0,
    marginBottom: 16,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500" as const,
  },
  catChipTextActive: {
    color: Colors.white,
  },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  descInput: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700" as const,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  brandBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  brandBadgeText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: "600" as const,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    maxWidth: 260,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
