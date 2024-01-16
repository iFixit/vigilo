{{/*
Expand the name of the chart.
*/}}
{{- define "vigilo.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "vigilo.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/* Generate a default name for the Lighthouse Config ConfigMap */}}
{{- define "vigilo.lighthouseConfigCM.name" -}}
{{- default (printf "%s-lighthouse-cm" (include "vigilo.fullname" .)) .Values.configs.lighthouse.configMapName | trunc 63 | trimSuffix "-" }}
{{- end -}}

{{/* Generate a default name for the Urls ConfigMap */}}
{{- define "vigilo.urlsCM.name" -}}
{{- default (printf "%s-urls-cm" (include "vigilo.fullname" .)) .Values.configs.urls.configMapName | trunc 63 | trimSuffix "-" }}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "vigilo.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "vigilo.labels" -}}
helm.sh/chart: {{ include "vigilo.chart" . }}
{{ include "vigilo.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "vigilo.selectorLabels" -}}
app.kubernetes.io/name: {{ include "vigilo.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}