import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import {
  Plus,
  X,
  Trash2,
  Copy,
  Send,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useCreator } from "@/contexts/CreatorContext";
import { Invoice, InvoiceItem } from "@/types";

export default function InvoiceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    dealId?: string;
    brandName?: string;
    brandEmail?: string;
    budget?: string;
  }>();
  const { profile, deliverables, addInvoice } = useCreator();

  const [brandName, setBrandName] = useState(params.brandName ?? "");
  const [brandEmail, setBrandEmail] = useState(params.brandEmail ?? "");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>(() => {
    if (params.budget && parseFloat(params.budget) > 0) {
      return [{ title: "Brand Deal", price: parseFloat(params.budget), quantity: 1 }];
    }
    return [];
  });
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({ title: "", price: "", quantity: "1" });

  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const addItem = useCallback(() => {
    if (!newItem.title) {
      Alert.alert("Missing Title", "Please enter an item title.");
      return;
    }
    const price = parseFloat(newItem.price);
    if (isNaN(price) || price <= 0) {
      Alert.alert("Invalid Price", "Please enter a valid price.");
      return;
    }
    const qty = parseInt(newItem.quantity, 10) || 1;
    setItems((prev) => [...prev, { title: newItem.title, price, quantity: qty }]);
    setNewItem({ title: "", price: "", quantity: "1" });
    setShowAddItem(false);
  }, [newItem]);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addFromRateCard = useCallback(
    (deliverableId: string) => {
      const d = deliverables.find((del) => del.id === deliverableId);
      if (!d) return;
      setItems((prev) => [...prev, { title: d.title, description: d.description, price: d.price, quantity: 1 }]);
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [deliverables]
  );

  const generateInvoiceText = useCallback(() => {
    const lines: string[] = [];
    lines.push("═══════════════════════════════");
    lines.push(`INVOICE from ${profile.name || "Creator"}`);
    lines.push("═══════════════════════════════");
    lines.push("");
    if (brandName) lines.push(`To: ${brandName}`);
    if (brandEmail) lines.push(`Email: ${brandEmail}`);
    if (dueDate) lines.push(`Due: ${dueDate}`);
    lines.push(`Date: ${new Date().toLocaleDateString()}`);
    lines.push("");
    lines.push("───────────────────────────────");
    items.forEach((item) => {
      const lineTotal = item.price * item.quantity;
      if (item.quantity > 1) {
        lines.push(`${item.title}  x${item.quantity}  $${lineTotal}`);
      } else {
        lines.push(`${item.title}  $${lineTotal}`);
      }
    });
    lines.push("───────────────────────────────");
    lines.push(`TOTAL: $${total}`);
    lines.push("");
    if (notes) {
      lines.push(`Notes: ${notes}`);
      lines.push("");
    }
    if (profile.username) {
      lines.push(`ugcio.app/${profile.username}`);
    }
    return lines.join("\n");
  }, [profile, brandName, brandEmail, dueDate, items, total, notes]);

  const handleCopyInvoice = useCallback(async () => {
    const text = generateInvoiceText();
    await Clipboard.setStringAsync(text);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert("Copied!", "Invoice text copied to clipboard. Paste it in an email or DM.");
  }, [generateInvoiceText]);

  const handleSave = useCallback(() => {
    if (items.length === 0) {
      Alert.alert("No Items", "Please add at least one item to the invoice.");
      return;
    }
    const invoice: Invoice = {
      id: Date.now().toString(),
      dealId: params.dealId,
      brandName,
      brandEmail,
      items,
      total,
      status: "draft",
      createdAt: new Date().toISOString(),
      dueDate: dueDate || undefined,
      notes: notes || undefined,
    };
    addInvoice(invoice);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert("Invoice Saved!", "Your invoice has been saved.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  }, [items, brandName, brandEmail, total, dueDate, notes, params.dealId, addInvoice, router]);

  const activeDeliverables = useMemo(
    () => deliverables.filter((d) => d.isActive),
    [deliverables]
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerSection}>
        <Text style={styles.fromLabel}>FROM</Text>
        <Text style={styles.fromName}>{profile.name || "Your Name"}</Text>
        {profile.username ? (
          <Text style={styles.fromHandle}>ugcio.app/{profile.username}</Text>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.fieldLabel}>Bill To</Text>
        <TextInput
          style={styles.input}
          value={brandName}
          onChangeText={setBrandName}
          placeholder="Brand / Company name"
          placeholderTextColor={Colors.textTertiary}
        />
        <TextInput
          style={[styles.input, { marginTop: 8 }]}
          value={brandEmail}
          onChangeText={setBrandEmail}
          placeholder="Email address"
          placeholderTextColor={Colors.textTertiary}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.fieldLabel}>Due Date (optional)</Text>
        <TextInput
          style={styles.input}
          value={dueDate}
          onChangeText={setDueDate}
          placeholder="e.g. March 30, 2025"
          placeholderTextColor={Colors.textTertiary}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.fieldLabel}>Line Items</Text>
          <TouchableOpacity
            onPress={() => setShowAddItem(true)}
            style={styles.addSmallBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Plus size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {activeDeliverables.length > 0 && (
          <View style={styles.quickAddSection}>
            <Text style={styles.quickAddLabel}>Quick add from rate card:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickAddRow}
            >
              {activeDeliverables.map((d) => (
                <TouchableOpacity
                  key={d.id}
                  style={styles.quickAddChip}
                  onPress={() => addFromRateCard(d.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickAddChipText}>{d.title}</Text>
                  <Text style={styles.quickAddChipPrice}>${d.price}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {items.map((item, index) => (
          <View key={index} style={styles.lineItem}>
            <View style={styles.lineItemInfo}>
              <Text style={styles.lineItemTitle}>{item.title}</Text>
              {item.quantity > 1 && (
                <Text style={styles.lineItemQty}>x{item.quantity}</Text>
              )}
            </View>
            <View style={styles.lineItemRight}>
              <Text style={styles.lineItemPrice}>
                ${(item.price * item.quantity).toLocaleString()}
              </Text>
              <TouchableOpacity
                onPress={() => removeItem(index)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Trash2 size={14} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {showAddItem && (
          <View style={styles.addItemForm}>
            <TextInput
              style={styles.inputSmall}
              value={newItem.title}
              onChangeText={(t) => setNewItem((p) => ({ ...p, title: t }))}
              placeholder="Item name"
              placeholderTextColor={Colors.textTertiary}
            />
            <View style={styles.addItemRow}>
              <TextInput
                style={[styles.inputSmall, { flex: 1 }]}
                value={newItem.price}
                onChangeText={(t) => setNewItem((p) => ({ ...p, price: t }))}
                placeholder="Price ($)"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.inputSmall, { width: 60 }]}
                value={newItem.quantity}
                onChangeText={(t) => setNewItem((p) => ({ ...p, quantity: t }))}
                placeholder="Qty"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.addItemActions}>
              <TouchableOpacity
                style={styles.cancelSmallBtn}
                onPress={() => {
                  setShowAddItem(false);
                  setNewItem({ title: "", price: "", quantity: "1" });
                }}
              >
                <Text style={styles.cancelSmallText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addItemBtn} onPress={addItem}>
                <Text style={styles.addItemBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {items.length === 0 && !showAddItem && (
          <TouchableOpacity
            style={styles.emptyAddRow}
            onPress={() => setShowAddItem(true)}
            activeOpacity={0.7}
          >
            <Plus size={16} color={Colors.textTertiary} />
            <Text style={styles.emptyAddText}>Add line items</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.totalSection}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>${total.toLocaleString()}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.fieldLabel}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Payment terms, special instructions..."
          placeholderTextColor={Colors.textTertiary}
          multiline
          textAlignVertical="top"
        />
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.copyBtn}
          onPress={handleCopyInvoice}
          activeOpacity={0.8}
        >
          <Copy size={16} color={Colors.primary} />
          <Text style={styles.copyBtnText}>Copy Text</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.saveInvoiceBtn}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Send size={16} color={Colors.white} />
          <Text style={styles.saveBtnText}>Save Invoice</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
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
  headerSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  fromLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    letterSpacing: 2,
    marginBottom: 6,
    fontWeight: "600" as const,
  },
  fromName: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: Colors.text,
  },
  fromHandle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notesInput: {
    minHeight: 80,
    paddingTop: 14,
  },
  addSmallBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  quickAddSection: {
    marginBottom: 12,
  },
  quickAddLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginBottom: 8,
  },
  quickAddRow: {
    gap: 8,
  },
  quickAddChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickAddChipText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: "500" as const,
  },
  quickAddChipPrice: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "700" as const,
  },
  lineItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  lineItemInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  lineItemTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  lineItemQty: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  lineItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  lineItemPrice: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  addItemForm: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 8,
  },
  inputSmall: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addItemRow: {
    flexDirection: "row",
    gap: 8,
  },
  addItemActions: {
    flexDirection: "row",
    gap: 8,
  },
  cancelSmallBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelSmallText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  addItemBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  addItemBtnText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  emptyAddRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: "dashed",
  },
  emptyAddText: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: Colors.primary,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  copyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  copyBtnText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  saveInvoiceBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 14,
    backgroundColor: Colors.primary,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.white,
  },
});
