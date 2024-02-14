import { v1 } from "@datadog/datadog-api-client";
import IWidget from "./IWidget.js";
import { QueryValueWidgetDefinition } from "./widgetTypes.js";
import { WidgetTextAlign } from "@datadog/datadog-api-client/dist/packages/datadog-api-client-v1/index.js";

export default class QueryValueWidget implements IWidget {
    // Default values
    titleSize = "16";
    titleAlign: WidgetTextAlign = "left";
    type: v1.QueryValueWidgetDefinitionType = "query_value";

    createWidget(widgetDefinition: QueryValueWidgetDefinition, width = 2, height = 2, position?: {x: number, y: number}): v1.Widget {
        return {
            definition: {
                title: "",
                titleSize: this.titleSize,
                titleAlign: this.titleAlign,
                type: this.type,
                showLegend: true,
                autoscale: true,
                precision: 2,
                ...widgetDefinition
            },
            layout: {
                width: width,
                height: height,
                x: position?.x || 0,
                y: position?.y || 0
            }
        }
    }

    createAlertMaker(value: number, comparator: v1.WidgetComparator, color: 'red' | 'yellow' | 'green' ): v1.WidgetConditionalFormat {
        return {
            comparator: comparator,
            value: value,
            palette: `white_on_${color}`
        }
    }
}