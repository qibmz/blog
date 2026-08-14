<script setup lang="ts">
import type { ChartType, ChartUIToolInvocation } from '#shared/utils/tools/chart'
import type { BulletLegendItemInterface } from 'vue-chrts/types'
import { CurveType, LegendPosition } from 'vue-chrts/enums'
import { AreaChart, BarChart, DonutChart, DonutType, LineChart } from 'vue-chrts'

type ChartPayload = {
  type?: ChartType
  title?: string
  data: Array<Record<string, string | number>>
  xKey: string
  series: Array<{ key: string, name: string, color: string }>
  xLabel?: string
  yLabel?: string
}

const props = defineProps<{
  invocation: ChartUIToolInvocation
}>()

function isChartPayload(value: unknown): value is ChartPayload {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return Array.isArray(v.data)
    && v.data.length > 0
    && typeof v.xKey === 'string'
    && Array.isArray(v.series)
    && v.series.length > 0
}

/** chart tool 的 execute 只是 echo；input 齐全即可渲染，不必死等 output-available */
const chart = computed<ChartPayload | null>(() => {
  if (props.invocation.state === 'output-available' && isChartPayload(props.invocation.output)) {
    return props.invocation.output
  }
  if (
    (props.invocation.state === 'input-available' || props.invocation.state === 'output-available')
    && isChartPayload(props.invocation.input)
  ) {
    return props.invocation.input
  }
  return null
})

const chartType = computed<ChartType>(() => {
  const type = chart.value?.type
  return type === 'area' || type === 'bar' || type === 'donut' ? type : 'line'
})

const cartesianComponent = computed(() => {
  if (chartType.value === 'area') return AreaChart
  if (chartType.value === 'bar') return BarChart
  return LineChart
})

const titleIcon = computed(() => {
  return ({
    line: 'i-lucide-line-chart',
    area: 'i-lucide-chart-area',
    bar: 'i-lucide-chart-column',
    donut: 'i-lucide-chart-pie'
  })[chartType.value]
})

const color = computed(() => {
  return ({
    'output-error': 'bg-muted text-error'
  })[props.invocation.state as string] || 'bg-muted text-white'
})

const icon = computed(() => {
  return ({
    'input-available': 'i-lucide-line-chart',
    'output-error': 'i-lucide-triangle-alert'
  })[props.invocation.state as string] || 'i-lucide-loader-circle'
})

const message = computed(() => {
  return ({
    'input-available': '正在生成图表...',
    'output-error': '图表生成失败，请重试'
  })[props.invocation.state as string] || '正在加载图表数据...'
})

const xFormatter = (payload: ChartPayload) => {
  return (tick: number, _i?: number, _ticks?: number[]): string => {
    if (!payload.data[tick]) return ''
    return String(payload.data[tick]![payload.xKey] ?? '')
  }
}

const categories = computed(() => {
  if (!chart.value) return {} as Record<string, BulletLegendItemInterface>
  return chart.value.series.reduce((acc, serie) => {
    acc[serie.key] = {
      name: serie.name,
      color: serie.color
    }
    return acc
  }, {} as Record<string, BulletLegendItemInterface>)
})

const yAxisKeys = computed(() => chart.value?.series.map(serie => serie.key) ?? [])

/** Donut：每行一个扇区，数值取首个 series.key，颜色按 series 轮询 */
const donutData = computed(() => {
  if (!chart.value || chartType.value !== 'donut') return [] as number[]
  const valueKey = chart.value.series[0]!.key
  return chart.value.data.map((row) => {
    const raw = row[valueKey]
    return typeof raw === 'number' ? raw : Number(raw) || 0
  })
})

const donutCategories = computed(() => {
  if (!chart.value || chartType.value !== 'donut') return {} as Record<string, BulletLegendItemInterface>
  const colors = chart.value.series.map(s => s.color)
  return chart.value.data.reduce((acc, row, index) => {
    const label = String(row[chart.value!.xKey] ?? `项${index + 1}`)
    acc[`slice-${index}`] = {
      name: label,
      color: colors[index % colors.length] || '#3b82f6'
    }
    return acc
  }, {} as Record<string, BulletLegendItemInterface>)
})

const formatValue = (value: string | number | undefined): string => {
  if (value === undefined || value === null) return 'N/A'
  if (typeof value === 'string') return value

  if (Number.isInteger(value)) {
    return value.toLocaleString()
  }
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
}

const sharedCartesianProps = computed(() => {
  if (!chart.value) return null
  return {
    height: 300,
    data: chart.value.data,
    categories: categories.value,
    xFormatter: xFormatter(chart.value),
    xLabel: chart.value.xLabel,
    yLabel: chart.value.yLabel,
    yGridLine: true,
    legendPosition: LegendPosition.TopRight,
    hideLegend: false,
    xNumTicks: Math.min(6, chart.value.data.length),
    yNumTicks: 5
  }
})
</script>

<template>
  <div
    v-if="chart"
    class="my-5"
  >
    <div
      v-if="chart.title"
      class="flex items-center gap-2 mb-2"
    >
      <UIcon
        :name="titleIcon"
        class="size-5 text-primary shrink-0"
      />
      <div class="min-w-0">
        <h3 class="text-lg font-semibold truncate">
          {{ chart.title }}
        </h3>
      </div>
    </div>

    <div class="relative overflow-hidden">
      <div class="dot-pattern h-full -top-5 left-0 right-0" />

      <ClientOnly>
        <DonutChart
          v-if="chartType === 'donut'"
          :type="DonutType.Full"
          :data="donutData"
          :categories="donutCategories"
          :radius="8"
          :height="280"
          :arc-width="28"
          :legend-position="LegendPosition.BottomCenter"
          :hide-legend="false"
        />

        <component
          :is="cartesianComponent"
          v-else-if="sharedCartesianProps"
          v-bind="sharedCartesianProps"
          :curve-type="chartType !== 'bar' ? CurveType.MonotoneX : undefined"
          :y-axis="chartType === 'bar' ? yAxisKeys : undefined"
          :radius="chartType === 'bar' ? 4 : undefined"
        >
          <template #tooltip="{ values }">
            <div class="bg-muted/50 rounded-sm px-2 py-1 shadow-lg backdrop-blur-sm max-w-xs ring ring-offset-2 ring-offset-bg ring-default border border-default">
              <div
                v-if="values && values[chart.xKey]"
                class="text-sm font-semibold text-highlighted mb-2"
              >
                {{ values[chart.xKey] }}
              </div>
              <div class="space-y-1.5">
                <div
                  v-for="serie in chart.series"
                  :key="serie.key"
                  class="flex items-center justify-between gap-3"
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <div
                      class="size-2.5 rounded-full shrink-0"
                      :style="{ backgroundColor: serie.color }"
                    />
                    <span class="text-sm text-muted truncate">{{ serie.name }}</span>
                  </div>
                  <span class="text-sm font-semibold text-highlighted shrink-0">
                    {{ formatValue(values?.[serie.key]) }}
                  </span>
                </div>
              </div>
            </div>
          </template>
        </component>

        <template #fallback>
          <div class="flex items-center justify-center h-44 text-sm text-muted">
            正在渲染图表...
          </div>
        </template>
      </ClientOnly>
    </div>
  </div>

  <div
    v-else
    class="rounded-xl px-5 py-4 my-5"
    :class="color"
  >
    <div class="flex items-center justify-center h-44">
      <div class="text-center">
        <UIcon
          :name="icon"
          class="size-8 mx-auto mb-2"
          :class="[invocation.state === 'input-streaming' && 'animate-spin']"
        />
        <div class="text-sm">
          {{ message }}
        </div>
      </div>
    </div>
  </div>
</template>

<style>
:root {
  --vis-tooltip-padding: 0 !important;
  --vis-tooltip-background-color: transparent !important;
  --vis-tooltip-border-color: transparent !important;

  --vis-axis-grid-color: rgba(255, 255, 255, 0) !important;
  --vis-axis-tick-label-color: var(--ui-text-muted) !important;
  --vis-axis-label-color: var(--ui-text-toned) !important;
  --vis-legend-label-color: var(--ui-text-muted) !important;

  --dot-pattern-color: #111827;
}

.dark {
  --dot-pattern-color: #9ca3af;
}

.dot-pattern {
  position: absolute;
  background-image: radial-gradient(var(--dot-pattern-color) 1px, transparent 1px);
  background-size: 7px 7px;
  background-position: -8.5px -8.5px;
  opacity: 20%;
  mask-image: radial-gradient(ellipse at center, rgba(0, 0, 0, 1), transparent 75%);
}
</style>
