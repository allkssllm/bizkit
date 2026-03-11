package controllers

import (
	"fmt"
	"math"
	"net/http"
	"strconv"
	"time"

	"bizkit-api/config"
	"bizkit-api/models"

	"github.com/gin-gonic/gin"
)

// GetSalesReport returns aggregated sales data based on the requested period
func GetSalesReport(c *gin.Context) {
	period := c.DefaultQuery("period", "daily")
	dateStr := c.DefaultQuery("date", time.Now().Format("2006-01-02"))
	statBy := c.DefaultQuery("stat_by", "qty")

	// Parse the reference date
	refDate, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD"})
		return
	}

	var startDate, endDate time.Time
	var periodLabel string

	switch period {
	case "daily":
		startDate = time.Date(refDate.Year(), refDate.Month(), refDate.Day(), 0, 0, 0, 0, refDate.Location())
		endDate = startDate.Add(24*time.Hour - time.Second)
		periodLabel = formatIndonesianDate(startDate)
	case "weekly":
		// Get the start of the week (Monday)
		weekday := int(refDate.Weekday())
		if weekday == 0 {
			weekday = 7
		}
		startDate = time.Date(refDate.Year(), refDate.Month(), refDate.Day()-(weekday-1), 0, 0, 0, 0, refDate.Location())
		endDate = startDate.AddDate(0, 0, 7).Add(-time.Second)
		periodLabel = fmt.Sprintf("%s - %s", startDate.Format("02/01/06"), endDate.Format("02/01/06"))
	case "monthly":
		startDate = time.Date(refDate.Year(), refDate.Month(), 1, 0, 0, 0, 0, refDate.Location())
		endDate = startDate.AddDate(0, 1, 0).Add(-time.Second)
		periodLabel = formatIndonesianMonth(startDate)
	case "yearly":
		startDate = time.Date(refDate.Year(), 1, 1, 0, 0, 0, 0, refDate.Location())
		endDate = time.Date(refDate.Year(), 12, 31, 23, 59, 59, 0, refDate.Location())
		periodLabel = fmt.Sprintf("%d", refDate.Year())
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid period. Use daily, weekly, monthly, or yearly"})
		return
	}

	// Fetch orders within date range
	var orders []models.Order
	config.DB.Preload("PaymentMethod").Preload("User").Preload("Items").Preload("Items.Product").Preload("Items.Product.Category").
		Where("created_at BETWEEN ? AND ? AND status = ?", startDate, endDate, "Completed").
		Order("created_at ASC").
		Find(&orders)

	// Build summary
	totalNota := len(orders)
	var totalQty int
	var totalOmzet float64
	for _, o := range orders {
		totalQty += o.TotalQty
		totalOmzet += o.TotalAmount
	}

	days := endDate.Sub(startDate).Hours()/24 + 1
	if days < 1 {
		days = 1
	}

	avgNota := float64(totalNota) / days
	avgQty := float64(totalQty) / days
	avgOmzet := totalOmzet / days
	avgQtyPerNota := float64(0)
	avgOmzetPerNota := float64(0)
	avgOmzetPerQty := float64(0)
	if totalNota > 0 {
		avgQtyPerNota = float64(totalQty) / float64(totalNota)
		avgOmzetPerNota = totalOmzet / float64(totalNota)
	}
	if totalQty > 0 {
		avgOmzetPerQty = totalOmzet / float64(totalQty)
	}

	// Payment methods breakdown
	paymentMethods := getPaymentMethodBreakdown(orders)

	// Product stats
	products := getProductStats(orders, statBy)

	// Category stats
	categories := getCategoryStats(orders, statBy)

	// Chart data
	chartPerPeriod := getChartPerPeriod(orders, period, startDate, endDate, statBy)
	chartPerDay := getChartPerDay(orders, statBy)
	chartPerHour := getChartPerHour(orders, statBy)

	// Format orders for response
	orderList := formatOrders(orders, period)

	c.JSON(http.StatusOK, gin.H{
		"period":       period,
		"period_label": periodLabel,
		"date_range": gin.H{
			"start": startDate.Format("2006-01-02"),
			"end":   endDate.Format("2006-01-02"),
		},
		"orders": orderList,
		"summary": gin.H{
			"total_nota":         totalNota,
			"total_qty":          totalQty,
			"total_omzet":        math.Round(totalOmzet*100) / 100,
			"avg_nota":           math.Round(avgNota*100) / 100,
			"avg_qty":            math.Round(avgQty*100) / 100,
			"avg_omzet":          math.Round(avgOmzet*100) / 100,
			"avg_qty_per_nota":   math.Round(avgQtyPerNota*100) / 100,
			"avg_omzet_per_nota": math.Round(avgOmzetPerNota*100) / 100,
			"avg_omzet_per_qty":  math.Round(avgOmzetPerQty*100) / 100,
		},
		"payment_methods": paymentMethods,
		"products":        products,
		"categories":      categories,
		"chart_data": gin.H{
			"per_period": chartPerPeriod,
			"per_day":    chartPerDay,
			"per_hour":   chartPerHour,
		},
	})
}

func formatOrders(orders []models.Order, period string) []gin.H {
	if period == "daily" {
		var result []gin.H
		for i, o := range orders {
			userName := ""
			if o.User.Username != "" {
				userName = o.User.Username
			}
			item := gin.H{
				"no":            i + 1,
				"waktu":         o.CreatedAt.Format("15:04"),
				"customer_name": o.CustomerName,
				"payment":       o.PaymentMethod.Name,
				"qty":           o.TotalQty,
				"total":         o.TotalAmount,
				"discount":      o.Discount,
				"user_name":     userName,
				"created_at":    o.CreatedAt,
			}
			result = append(result, item)
		}
		return result
	}

	// For weekly, monthly, yearly -> aggregate
	type aggDate struct {
		Label string
		N     int
		Q     int
		Omzet float64
		Hari  string
		Tgl   string
	}

	// order map to preserve insertion structure but aggregate
	var aggKeys []string
	aggMap := make(map[string]*aggDate)

	for _, o := range orders {
		var key, hari, tgl string

		if period == "yearly" {
			key = o.CreatedAt.Format("2006-01") // YYYY-MM
			hari = o.CreatedAt.Format("January")
			tgl = "" // Only Bulan
		} else {
			key = o.CreatedAt.Format("2006-01-02")
			hari = formatIndonesianDay(o.CreatedAt.Weekday())
			tgl = o.CreatedAt.Format("02/01/2006")
		}

		if _, exists := aggMap[key]; !exists {
			aggKeys = append(aggKeys, key)
			aggMap[key] = &aggDate{
				Label: key,
				Hari:  hari,
				Tgl:   tgl,
			}
		}

		aggMap[key].N += 1
		aggMap[key].Q += o.TotalQty
		aggMap[key].Omzet += o.TotalAmount
	}

	var result []gin.H
	for i, k := range aggKeys {
		agg := aggMap[k]
		result = append(result, gin.H{
			"no":    i + 1,
			"hari":  agg.Hari,
			"tgl":   agg.Tgl,
			"n":     agg.N,
			"qty":   agg.Q,
			"total": agg.Omzet,
		})
	}
	return result
}

func getPaymentMethodBreakdown(orders []models.Order) []gin.H {
	methodTotals := make(map[string]float64)
	for _, o := range orders {
		name := o.PaymentMethod.Name
		if name == "" {
			name = "Lainnya"
		}
		methodTotals[name] += o.TotalAmount
	}

	var result []gin.H
	totalPenjualan := float64(0)
	for name, total := range methodTotals {
		result = append(result, gin.H{"name": name, "total": total})
		totalPenjualan += total
	}
	result = append(result, gin.H{"name": "Total Penjualan", "total": totalPenjualan})
	return result
}

func getProductStats(orders []models.Order, statBy string) []gin.H {
	type productStat struct {
		Name  string
		Qty   int
		Omzet float64
		Nota  int
	}

	productMap := make(map[uint]*productStat)
	for _, o := range orders {
		// track which products appear in this order to avoid counting same product multiple times per nota
		seenInOrder := make(map[uint]bool)

		for _, item := range o.Items {
			if _, ok := productMap[item.ProductID]; !ok {
				productMap[item.ProductID] = &productStat{Name: item.Product.Name}
			}
			productMap[item.ProductID].Qty += item.Qty
			productMap[item.ProductID].Omzet += item.Subtotal
			if !seenInOrder[item.ProductID] {
				productMap[item.ProductID].Nota++
				seenInOrder[item.ProductID] = true
			}
		}
	}

	var result []gin.H
	for _, ps := range productMap {
		value := float64(ps.Qty)
		if statBy == "omzet" {
			value = ps.Omzet
		} else if statBy == "nota" {
			value = float64(ps.Nota)
		}
		result = append(result, gin.H{"name": ps.Name, "qty": ps.Qty, "omzet": ps.Omzet, "nota": ps.Nota, "value": value})
	}
	return result
}

func getCategoryStats(orders []models.Order, statBy string) []gin.H {
	type catStat struct {
		Name  string
		Qty   int
		Omzet float64
		Nota  int
	}

	catMap := make(map[uint]*catStat)
	for _, o := range orders {
		seenInOrder := make(map[uint]bool)
		for _, item := range o.Items {
			catID := item.Product.CategoryID
			catName := item.Product.Category.Name
			if catName == "" {
				catName = "Tanpa Kategori"
			}
			if _, ok := catMap[catID]; !ok {
				catMap[catID] = &catStat{Name: catName}
			}
			catMap[catID].Qty += item.Qty
			catMap[catID].Omzet += item.Subtotal
			if !seenInOrder[catID] {
				catMap[catID].Nota++
				seenInOrder[catID] = true
			}
		}
	}

	var result []gin.H
	for _, cs := range catMap {
		value := float64(cs.Qty)
		if statBy == "omzet" {
			value = cs.Omzet
		} else if statBy == "nota" {
			value = float64(cs.Nota)
		}
		result = append(result, gin.H{"name": cs.Name, "qty": cs.Qty, "omzet": cs.Omzet, "nota": cs.Nota, "value": value})
	}
	return result
}

func getChartPerPeriod(orders []models.Order, period string, start, end time.Time, statBy string) []gin.H {
	switch period {
	case "daily":
		// Per hour for daily
		hourData := make(map[int]float64)
		for h := 0; h < 24; h++ {
			hourData[h] = 0
		}
		for _, o := range orders {
			h := o.CreatedAt.Hour()
			if statBy == "omzet" {
				hourData[h] += o.TotalAmount
			} else if statBy == "nota" {
				hourData[h] += 1
			} else {
				hourData[h] += float64(o.TotalQty)
			}
		}
		var result []gin.H
		for h := 0; h < 24; h++ {
			result = append(result, gin.H{"label": fmt.Sprintf("%02d:00", h), "value": hourData[h]})
		}
		return result

	case "weekly":
		// Per day for weekly
		dayData := make(map[string]float64)
		days := []string{}
		for d := start; !d.After(end); d = d.AddDate(0, 0, 1) {
			label := d.Format("02/01")
			days = append(days, label)
			dayData[label] = 0
		}
		for _, o := range orders {
			label := o.CreatedAt.Format("02/01")
			if statBy == "omzet" {
				dayData[label] += o.TotalAmount
			} else if statBy == "nota" {
				dayData[label] += 1
			} else {
				dayData[label] += float64(o.TotalQty)
			}
		}
		var result []gin.H
		for _, label := range days {
			result = append(result, gin.H{"label": label, "value": dayData[label]})
		}
		return result

	case "monthly":
		// Per day for monthly
		dayData := make(map[int]float64)
		daysInMonth := end.Day()
		for d := 1; d <= daysInMonth; d++ {
			dayData[d] = 0
		}
		for _, o := range orders {
			d := o.CreatedAt.Day()
			if statBy == "omzet" {
				dayData[d] += o.TotalAmount
			} else if statBy == "nota" {
				dayData[d] += 1
			} else {
				dayData[d] += float64(o.TotalQty)
			}
		}
		var result []gin.H
		for d := 1; d <= daysInMonth; d++ {
			result = append(result, gin.H{"label": fmt.Sprintf("%02d", d), "value": dayData[d]})
		}
		return result

	case "yearly":
		// Per month for yearly
		monthNames := []string{"Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"}
		monthData := make(map[int]float64)
		for m := 1; m <= 12; m++ {
			monthData[m] = 0
		}
		for _, o := range orders {
			m := int(o.CreatedAt.Month())
			if statBy == "omzet" {
				monthData[m] += o.TotalAmount
			} else if statBy == "nota" {
				monthData[m] += 1
			} else {
				monthData[m] += float64(o.TotalQty)
			}
		}
		var result []gin.H
		for m := 1; m <= 12; m++ {
			result = append(result, gin.H{"label": monthNames[m-1], "value": monthData[m]})
		}
		return result
	}
	return nil
}

func getChartPerDay(orders []models.Order, statBy string) []gin.H {
	dayNames := []string{"Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"}
	dayTotals := make(map[int]float64)
	dayCounts := make(map[int]int)

	for _, o := range orders {
		wd := int(o.CreatedAt.Weekday())
		if wd == 0 {
			wd = 7 // Sunday = 7
		}
		dayCounts[wd]++
		if statBy == "omzet" {
			dayTotals[wd] += o.TotalAmount
		} else if statBy == "nota" {
			dayTotals[wd] += 1
		} else {
			dayTotals[wd] += float64(o.TotalQty)
		}
	}

	var result []gin.H
	for i := 1; i <= 7; i++ {
		avg := float64(0)
		if dayCounts[i] > 0 {
			avg = math.Round((dayTotals[i]/float64(dayCounts[i]))*100) / 100
		}
		result = append(result, gin.H{"label": dayNames[i-1], "value": avg})
	}
	return result
}

func getChartPerHour(orders []models.Order, statBy string) []gin.H {
	hourTotals := make(map[int]float64)
	hourCounts := make(map[int]int)

	for _, o := range orders {
		h := o.CreatedAt.Hour()
		hourCounts[h]++
		if statBy == "omzet" {
			hourTotals[h] += o.TotalAmount
		} else if statBy == "nota" {
			hourTotals[h] += 1
		} else {
			hourTotals[h] += float64(o.TotalQty)
		}
	}

	// 21, 20, 19, ... 2, 1, 0 (reversed display as in KasirKuliner)
	var result []gin.H
	for h := 23; h >= 0; h-- {
		avg := float64(0)
		if hourCounts[h] > 0 {
			avg = math.Round((hourTotals[h]/float64(hourCounts[h]))*100) / 100
		}
		result = append(result, gin.H{"label": fmt.Sprintf("%d", h), "value": avg})
	}
	return result
}

// Helper: Indonesian date format
func formatIndonesianDate(t time.Time) string {
	days := []string{"Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"}
	months := []string{"Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"}
	return fmt.Sprintf("%s, %d %s %d", days[t.Weekday()], t.Day(), months[t.Month()-1], t.Year())
}

func formatIndonesianMonth(t time.Time) string {
	months := []string{"Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"}
	return fmt.Sprintf("%s %d", months[t.Month()-1], t.Year())
}

func formatIndonesianDay(wd time.Weekday) string {
	days := []string{"Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"}
	return days[wd]
}

// GetTrendReport handles the Trend Penjualan logic
func GetTrendReport(c *gin.Context) {
	trendType := c.DefaultQuery("type", "product") // "product" or "category"
	itemID := c.DefaultQuery("item_id", "")
	yearStr := c.DefaultQuery("year", fmt.Sprintf("%d", time.Now().Year()))

	year, err := strconv.Atoi(yearStr)
	if err != nil {
		year = time.Now().Year()
	}

	if itemID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "item_id is required"})
		return
	}

	startDate := time.Date(year, 1, 1, 0, 0, 0, 0, time.Local)
	endDate := time.Date(year, 12, 31, 23, 59, 59, 0, time.Local)

	var orders []models.Order
	config.DB.Preload("Items").Preload("Items.Product").
		Where("created_at BETWEEN ? AND ? AND status = ?", startDate, endDate, "Completed").
		Find(&orders)

	// We need 52/53 weeks details
	type WeekDetail struct {
		Minggu string  `json:"minggu"`
		N      int     `json:"n"`
		Q      int     `json:"q"`
		Omzet  float64 `json:"omzet"`
	}

	weeklyDetails := make(map[int]*WeekDetail)
	for w := 1; w <= 52; w++ {
		// Calculate precise Monday and Sunday for this ISO week
		// Approx labeling...
		monday := firstDayOfISOWeek(year, w, time.Local)
		sunday := monday.AddDate(0, 0, 6)
		mingguLabel := fmt.Sprintf("%s (%s-%s)", formatIndonesianMonthShort(monday.Month()), monday.Format("02/01"), sunday.Format("02/01"))

		weeklyDetails[w] = &WeekDetail{
			Minggu: mingguLabel,
			N:      0,
			Q:      0,
			Omzet:  0,
		}
	}

	// For averages
	daysInYear := 365.25

	hourCounts := make(map[int]int)
	hourQtys := make(map[int]int)
	dayQtys := make(map[int]int)

	totalQty := 0
	totalOmzet := float64(0)
	totalNota := 0

	for _, o := range orders {
		orderQty := 0
		orderOmzet := float64(0)
		hasRelevantItem := false

		for _, item := range o.Items {
			isRelevant := false
			if trendType == "product" && fmt.Sprintf("%d", item.ProductID) == itemID {
				isRelevant = true
			} else if trendType == "category" && fmt.Sprintf("%d", item.Product.CategoryID) == itemID {
				isRelevant = true
			}

			if isRelevant {
				hasRelevantItem = true
				orderQty += item.Qty
				orderOmzet += item.Subtotal
			}
		}

		if !hasRelevantItem {
			continue
		}

		totalQty += orderQty
		totalOmzet += orderOmzet
		totalNota++

		_, w := o.CreatedAt.ISOWeek()
		if w > 52 {
			w = 52
		}

		if det, exists := weeklyDetails[w]; exists {
			det.N++
			det.Q += orderQty
			det.Omzet += orderOmzet
		}

		h := o.CreatedAt.Hour()
		hourCounts[h]++
		hourQtys[h] += orderQty

		wd := int(o.CreatedAt.Weekday())
		if wd == 0 {
			wd = 7 // Sunday = 7
		}
		dayQtys[wd] += orderQty
	}

	// Build Chart Data
	var weeklyChart []gin.H
	var detailsList []gin.H

	for w := 1; w <= 52; w++ {
		wd := weeklyDetails[w]
		weeklyChart = append(weeklyChart, gin.H{"label": fmt.Sprintf("%d", w), "value": wd.Q})
		detailsList = append(detailsList, gin.H{
			"no":     w,
			"minggu": wd.Minggu,
			"n":      wd.N,
			"qty":    wd.Q,
			"omzet":  wd.Omzet,
		})
	}

	var dailyAvgChart []gin.H
	dayNames := []string{"Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"}
	for i := 1; i <= 7; i++ {
		// Assuming roughly 52 of each weekday in a year
		avg := float64(dayQtys[i]) / 52.0
		dailyAvgChart = append(dailyAvgChart, gin.H{"label": dayNames[i-1], "value": math.Round(avg*100) / 100})
	}

	var hourlyAvgChart []gin.H
	for h := 23; h >= 0; h-- {
		// Rata-rata per jam over the whole year (365 days)
		avg := float64(hourQtys[h]) / daysInYear
		avg = math.Round(avg*1000) / 1000 // Provide more precision for tiny values like 0.01 per hour
		hourlyAvgChart = append(hourlyAvgChart, gin.H{"label": fmt.Sprintf("%d", h), "value": avg})
	}

	// Yearly Averages Summary
	avgNota := float64(totalNota) / daysInYear
	avgQty := float64(totalQty) / daysInYear
	avgOmzet := totalOmzet / daysInYear

	avgQtyPerNota := float64(0)
	avgOmzetPerNota := float64(0)
	avgOmzetPerQty := float64(0)

	if totalNota > 0 {
		avgQtyPerNota = float64(totalQty) / float64(totalNota)
		avgOmzetPerNota = totalOmzet / float64(totalNota)
	}
	if totalQty > 0 {
		avgOmzetPerQty = totalOmzet / float64(totalQty)
	}

	c.JSON(http.StatusOK, gin.H{
		"year":    year,
		"type":    trendType,
		"item_id": itemID,
		"chart_data": gin.H{
			"weekly":     weeklyChart,
			"daily_avg":  dailyAvgChart,
			"hourly_avg": hourlyAvgChart,
		},
		"details": detailsList,
		"summary": gin.H{
			"avg_nota":           math.Round(avgNota*100) / 100,
			"avg_qty":            math.Round(avgQty*100) / 100,
			"avg_omzet":          math.Round(avgOmzet*100) / 100,
			"avg_qty_per_nota":   math.Round(avgQtyPerNota*100) / 100,
			"avg_omzet_per_nota": math.Round(avgOmzetPerNota*100) / 100,
			"avg_omzet_per_qty":  math.Round(avgOmzetPerQty*100) / 100,
			"total_n":            totalNota,
			"total_q":            totalQty,
			"total_omzet":        totalOmzet,
		},
	})
}

// Helper: Calculate the date of the first day of an ISO week
func firstDayOfISOWeek(year int, week int, timezone *time.Location) time.Time {
	date := time.Date(year, 0, 0, 0, 0, 0, 0, timezone)
	isoYear, isoWeek := date.ISOWeek()
	for date.Weekday() != time.Monday { // iterate back to Monday
		date = date.AddDate(0, 0, -1)
		isoYear, isoWeek = date.ISOWeek()
	}
	for isoYear < year { // iterate forward to the first day of the first week
		date = date.AddDate(0, 0, 1)
		isoYear, isoWeek = date.ISOWeek()
		if date.Weekday() == time.Monday {
			date = date.AddDate(0, 0, -1) // we want Monday
			break
		}
	}
	for isoWeek < week { // iterate forward to the requested week
		date = date.AddDate(0, 0, 7)
		isoYear, isoWeek = date.ISOWeek()
	}
	return date
}

func formatIndonesianMonthShort(m time.Month) string {
	months := []string{"Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"}
	return months[m-1]
}

// GetSalesHistory handles the Laporan Riwayat Penjualan
func GetSalesHistory(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	hasDiscount := c.Query("has_discount") // "true" or "false"

	var orders []models.Order
	db := config.DB.Model(&models.Order{}).Where("status = ?", "Completed")

	if startDate != "" && endDate != "" {
		start, _ := time.Parse("2006-01-02", startDate)
		end, _ := time.Parse("2006-01-02", endDate)
		end = end.Add(23*time.Hour + 59*time.Minute + 59*time.Second)

		db = db.Where("created_at BETWEEN ? AND ?", start, end)
	}

	if hasDiscount == "true" {
		db = db.Where("discount > ?", 0)
	}

	// Order by date descending
	db = db.Order("created_at desc").Find(&orders)

	totalPenjualan := float64(0)
	var result []map[string]interface{}
	for _, o := range orders {
		totalPenjualan += o.TotalAmount
		result = append(result, map[string]interface{}{
			"id":             o.ID,
			"tgl":            o.CreatedAt.Format("02/01/06 15:04"),
			"id_penjualan":   o.OrderNumber,
			"total":          o.TotalAmount,
			"nama_pelanggan": o.CustomerName,
		})
	}

	if result == nil {
		result = []map[string]interface{}{}
	}

	c.JSON(http.StatusOK, gin.H{
		"data": result,
		"summary": map[string]interface{}{
			"total_penjualan": totalPenjualan,
		},
	})
}
