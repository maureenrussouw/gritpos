import { useState } from "react";
import { View, Text, TextInput, ScrollView, FlatList, Pressable, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "@/components/ui/screen-header";
import { FormSheet } from "@/components/ui/form-sheet";
import { useTheme } from "@/lib/theme";
import { usePurchases, useCreatePurchase, type Purchase } from "@/hooks/use-purchases";
import { PurchaseForm } from "@/components/resource-forms/purchases-form";
import { exportResourceCsv } from "@/lib/export";
import { ImportSheet } from "@/components/ui/import-sheet";
import { relationLabel } from "@/lib/relation-label";
import { useSuppliers } from "@/hooks/use-suppliers";
const TABLE_WIDTH = 740;

export default function PurchasesScreen() {
  const router = useRouter();
  const { palette } = useTheme();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const create = useCreatePurchase();
  const fSupplierIDQuery = useSuppliers("", {}, "created_at", "desc", 500);
  const fSupplierIDOpts = fSupplierIDQuery.data?.pages.flatMap((p: any) => p.data) ?? [];
  const query = usePurchases(search, filters, sortBy, sortOrder);
  const items = query.data?.pages.flatMap((p) => p.data) ?? [];

  const onSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
  };

  const onExport = async () => {
    try {
      await exportResourceCsv("purchases", search ? "search=" + encodeURIComponent(search) : "");
    } catch (e: any) {
      Alert.alert("Export failed", e.message || "Please try again");
    }
  };

  const renderItem = ({ item }: { item: Purchase }) => (
    <Pressable
      onPress={() => router.push(`/purchases/${item.id}`)}
      className="flex-row items-center border-b border-[#E5E7EB] dark:border-[#1f1f2b] bg-white dark:bg-[#111118]"
      style={{ width: TABLE_WIDTH }}
    >
      <View style={{ width: 180 }} className="px-3 py-3">
        <Text numberOfLines={1} className="text-[14px] font-semibold text-[#0F1018] dark:text-white">{String(item.reference ?? "")}</Text>
      </View>
      <View style={{ width: 150 }} className="px-3 py-3">
        <Text numberOfLines={1} className="text-[14px] text-[#0F1018] dark:text-white">{relationLabel(item.supplier) || item.supplier_id || ""}</Text>
      </View>
      <View style={{ width: 110 }} className="px-3 py-3">
        <Text numberOfLines={1} className="text-[14px] text-[#0F1018] dark:text-white">{String(item.total ?? "")}</Text>
      </View>
      <View style={{ width: 150 }} className="px-3 py-3">
        <Text numberOfLines={1} className="text-[14px] text-[#0F1018] dark:text-white">{String(item.status ?? "")}</Text>
      </View>
      <View style={{ width: 150 }} className="px-3 py-3">
        <Text numberOfLines={1} className="text-[14px] text-[#0F1018] dark:text-white">{String(item.items ?? "")}</Text>
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-[#F4F4F6] dark:bg-[#0a0a0f]">
      <ScreenHeader
        title="Purchases"
        subtitle="Browse all purchases"
        showBack
        right={
          <View className="flex-row items-center">
            <Pressable onPress={() => setFilterOpen(true)} hitSlop={8} className="mr-4">
              <View>
                <Ionicons name="funnel-outline" size={21} color="#6c5ce7" />
                {Object.keys(filters).length > 0 ? <View className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#ff6b6b]" /> : null}
              </View>
            </Pressable>
            <Pressable onPress={onExport} hitSlop={8} className="mr-4">
              <Ionicons name="download-outline" size={23} color="#6c5ce7" />
            </Pressable>
            <Pressable onPress={() => setImportOpen(true)} hitSlop={8} className="mr-4">
              <Ionicons name="cloud-upload-outline" size={23} color="#6c5ce7" />
            </Pressable>
            <Pressable onPress={() => setSheetOpen(true)} hitSlop={8}>
              <Ionicons name="add-circle" size={28} color="#6c5ce7" />
            </Pressable>
          </View>
        }
      />
      <View className="px-6 pb-3">
        <View
          className="bg-white dark:bg-[#111118] border border-[#E5E7EB] dark:border-[#2a2a3a] rounded-2xl flex-row items-center px-4"
          style={{ height: 48 }}
        >
          <Ionicons name="search-outline" size={18} color={palette.inputIcon} />
          <TextInput
            className="flex-1 ml-2.5 text-[#0F1018] dark:text-white text-[15px]"
            placeholder="Search purchases..."
            placeholderTextColor={palette.placeholder}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ width: TABLE_WIDTH }}>
          <View className="flex-row border-b-2 border-[#E5E7EB] dark:border-[#2a2a3a]" style={{ width: TABLE_WIDTH }}>
            <Pressable onPress={() => onSort("reference")} style={{ width: 180 }} className="px-3 py-3 flex-row items-center">
              <Text className="text-[12px] font-semibold text-[#6B7280] dark:text-[#9090a8]" numberOfLines={1}>Reference</Text>
              {sortBy === "reference" ? <Ionicons name={sortOrder === "asc" ? "arrow-up" : "arrow-down"} size={12} color="#6c5ce7" style={{ marginLeft: 4 }} /> : null}
            </Pressable>
            <View style={{ width: 150 }} className="px-3 py-3">
              <Text className="text-[12px] font-semibold text-[#6B7280] dark:text-[#9090a8]" numberOfLines={1}>Supplier</Text>
            </View>
            <Pressable onPress={() => onSort("total")} style={{ width: 110 }} className="px-3 py-3 flex-row items-center">
              <Text className="text-[12px] font-semibold text-[#6B7280] dark:text-[#9090a8]" numberOfLines={1}>Total</Text>
              {sortBy === "total" ? <Ionicons name={sortOrder === "asc" ? "arrow-up" : "arrow-down"} size={12} color="#6c5ce7" style={{ marginLeft: 4 }} /> : null}
            </Pressable>
            <Pressable onPress={() => onSort("status")} style={{ width: 150 }} className="px-3 py-3 flex-row items-center">
              <Text className="text-[12px] font-semibold text-[#6B7280] dark:text-[#9090a8]" numberOfLines={1}>Status</Text>
              {sortBy === "status" ? <Ionicons name={sortOrder === "asc" ? "arrow-up" : "arrow-down"} size={12} color="#6c5ce7" style={{ marginLeft: 4 }} /> : null}
            </Pressable>
            <View style={{ width: 150 }} className="px-3 py-3">
              <Text className="text-[12px] font-semibold text-[#6B7280] dark:text-[#9090a8]" numberOfLines={1}>Items</Text>
            </View>
          </View>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            style={{ flex: 1 }}
            onEndReached={() => {
              if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
            }}
            onEndReachedThreshold={0.4}
            refreshControl={
              <RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} tintColor={palette.refresh} />
            }
            ListEmptyComponent={
              query.isLoading ? (
                <ActivityIndicator color={palette.refresh} style={{ marginTop: 40 }} />
              ) : (
                <Text className="text-[#6B7280] dark:text-[#9090a8] p-6">No purchases yet</Text>
              )
            }
            ListFooterComponent={
              query.isFetchingNextPage ? (
                <ActivityIndicator color={palette.refresh} style={{ marginVertical: 16 }} />
              ) : null
            }
          />
        </View>
      </ScrollView>

      <FormSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="New Purchase">
        <PurchaseForm
          submitting={create.isPending}
          submitLabel="Create Purchase"
          onSubmit={async (values) => {
            await create.mutateAsync(values);
            setSheetOpen(false);
          }}
        />
      </FormSheet>
      <FormSheet visible={filterOpen} onClose={() => setFilterOpen(false)} title="Filters">
        <Text className="text-[13px] font-semibold text-[#6B7280] dark:text-[#9090a8] mb-2">Supplier</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <Pressable onPress={() => setFilters((f) => { const n = { ...f }; delete n.supplier_id; return n; })} className={!filters.supplier_id ? "px-4 py-2 mr-2 rounded-full bg-[#6c5ce7]" : "px-4 py-2 mr-2 rounded-full bg-white dark:bg-[#111118] border border-[#E5E7EB] dark:border-[#2a2a3a]"}>
            <Text className={!filters.supplier_id ? "text-white font-medium" : "text-[#0F1018] dark:text-white"}>All</Text>
          </Pressable>
          {fSupplierIDOpts.map((opt: any) => (
            <Pressable key={opt.id} onPress={() => setFilters((f) => ({ ...f, supplier_id: opt.id }))} className={filters.supplier_id === opt.id ? "px-4 py-2 mr-2 rounded-full bg-[#6c5ce7]" : "px-4 py-2 mr-2 rounded-full bg-white dark:bg-[#111118] border border-[#E5E7EB] dark:border-[#2a2a3a]"}>
              <Text className={filters.supplier_id === opt.id ? "text-white font-medium" : "text-[#0F1018] dark:text-white"}>{relationLabel(opt) || opt.id}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Pressable onPress={() => setFilters({})} className="border border-[#E5E7EB] dark:border-[#2a2a3a] rounded-full py-3 items-center mb-3">
          <Text className="text-[#6B7280] dark:text-[#9090a8] font-semibold">Clear all</Text>
        </Pressable>
        <Pressable onPress={() => setFilterOpen(false)} className="bg-[#6c5ce7] rounded-full py-4 items-center">
          <Text className="text-white font-semibold text-[15px]">Done</Text>
        </Pressable>
      </FormSheet>

      <ImportSheet plural="purchases" visible={importOpen} onClose={() => setImportOpen(false)} onImported={() => query.refetch()} />
    </View>
  );
}
