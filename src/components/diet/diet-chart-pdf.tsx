import {
  Document,
  Image,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import {
  type DietDays,
  isHttpUrl,
  WEEKDAY_LABELS,
  WEEKDAYS,
} from "@/lib/diet-chart";
import { formatDateRange } from "@/lib/format";
import type { OrgBranding } from "@/lib/org-branding";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 32,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1f3328",
  },
  pageBg: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain",
    objectPosition: "center",
    opacity: 0.14,
  },
  header: {
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  logo: {
    width: 28,
    height: 28,
    objectFit: "contain",
  },
  brand: {
    fontSize: 9,
    letterSpacing: 1.6,
    color: "#2f6a4e",
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#163226",
  },
  meta: {
    marginTop: 5,
    fontSize: 10,
    color: "#4d6558",
  },
  day: {
    marginTop: 14,
  },
  dayTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "#2f6a4e",
    marginBottom: 6,
  },
  table: {
    borderWidth: 1,
    borderColor: "#cfe0d5",
    borderRadius: 4,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#2f6a4e",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  th: {
    color: "#f4faf6",
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#d7e6dc",
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: "flex-start",
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowAlt: {
    backgroundColor: "#f4f8f5",
  },
  colName: {
    width: "24%",
    paddingRight: 8,
  },
  colContent: {
    width: "56%",
    paddingRight: 8,
  },
  colQr: {
    width: "20%",
    alignItems: "center",
  },
  qrBlock: {
    alignItems: "center",
  },
  mealName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: "#163226",
  },
  mealContent: {
    fontSize: 9,
    lineHeight: 1.45,
    color: "#33463c",
  },
  qr: {
    width: 52,
    height: 52,
  },
  link: {
    marginTop: 4,
    fontSize: 8,
    color: "#2f6a4e",
    textDecoration: "underline",
  },
});

export function DietChartPdfDocument({
  title,
  clientName,
  createdByName,
  notes,
  startDate,
  endDate,
  days,
  qrCodes,
  branding,
}: {
  title: string;
  clientName?: string | null;
  createdByName?: string;
  notes?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  days: DietDays;
  qrCodes: Record<string, string>;
  branding: OrgBranding;
}) {
  return (
    <Document title={title.trim() || "Weekly diet chart"}>
      <Page size="A4" wrap style={styles.page}>
        {branding.pdfBackground ? (
          <Image src={branding.pdfBackground} fixed style={styles.pageBg} />
        ) : null}

        <View style={styles.header}>
          <View style={styles.brandRow}>
            {branding.logo ? (
              <Image src={branding.logo} style={styles.logo} />
            ) : null}
            <Text style={styles.brand}>{branding.name}</Text>
          </View>
          <Text style={styles.title}>
            {title.trim() || "Weekly diet chart"}
          </Text>
          {clientName?.trim() ? (
            <Text style={styles.meta}>Client: {clientName.trim()}</Text>
          ) : null}
          {formatDateRange(startDate, endDate) ? (
            <Text style={styles.meta}>
              {formatDateRange(startDate, endDate)}
            </Text>
          ) : null}
          {createdByName ? (
            <Text style={styles.meta}>Prepared by {createdByName}</Text>
          ) : null}
          {notes?.trim() ? (
            <Text style={styles.meta}>{notes.trim()}</Text>
          ) : null}
        </View>

        {WEEKDAYS.map((weekday) => {
          const meals = days[weekday].meals;

          return (
            <View key={weekday} style={styles.day} wrap>
              <Text style={styles.dayTitle} minPresenceAhead={72}>
                {WEEKDAY_LABELS[weekday]}
              </Text>
              <View style={styles.table}>
                <View style={styles.tableHeader} wrap={false}>
                  <Text style={[styles.th, styles.colName]}>Meal name</Text>
                  <Text style={[styles.th, styles.colContent]}>
                    Meal contents
                  </Text>
                  <Text style={[styles.th, styles.colQr]}>Recipe</Text>
                </View>
                {meals.length === 0 ? (
                  <View style={styles.row}>
                    <Text style={styles.mealContent}>No meals yet.</Text>
                  </View>
                ) : (
                  meals.map((meal, index) => {
                    const recipeUrl = meal.recipeUrl.trim();
                    const qr = isHttpUrl(recipeUrl)
                      ? qrCodes[recipeUrl]
                      : undefined;

                    return (
                      <View
                        key={meal.id}
                        wrap={false}
                        style={[
                          styles.row,
                          index % 2 === 1 ? styles.rowAlt : {},
                          index === meals.length - 1 ? styles.rowLast : {},
                        ]}
                      >
                        <View style={styles.colName}>
                          <Text style={styles.mealName}>{meal.name}</Text>
                        </View>
                        <View style={styles.colContent}>
                          <Text style={styles.mealContent}>
                            {meal.content.trim() || "-"}
                          </Text>
                        </View>
                        <View style={styles.colQr}>
                          {qr ? (
                            <View style={styles.qrBlock}>
                              <Image src={qr} style={styles.qr} />
                              <Link src={recipeUrl} style={styles.link}>
                                <Text>Recipe</Text>
                              </Link>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </View>
          );
        })}
      </Page>
    </Document>
  );
}
