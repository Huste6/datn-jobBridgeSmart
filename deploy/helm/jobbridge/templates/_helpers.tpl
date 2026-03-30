{% comment %}Dùng để định nghĩa tên cho các resource trong Kubernetes {% endcomment %}
{{- define "jobbridge.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{% comment %}Dùng để định nghĩa tên đầy đủ cho các resource trong Kubernetes {% endcomment %}
{{- define "jobbridge.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name (include "jobbridge.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{% comment %}Dùng để định nghĩa các label cho các resource trong Kubernetes {% endcomment %}
{{- define "jobbridge.labels" -}}
app.kubernetes.io/name: {{ include "jobbridge.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}
