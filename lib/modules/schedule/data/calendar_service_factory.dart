import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:anifox/core/network/http_client.dart';
import 'package:anifox/modules/schedule/data/services/anilist_calendar_service.dart';
import 'package:anifox/modules/schedule/data/services/kitsu_calendar_service.dart';
import 'package:anifox/modules/schedule/data/services/mal_calendar_service.dart';
import 'package:anifox/modules/schedule/data/services/simkl_calendar_service.dart';
import 'package:anifox/modules/schedule/models/models/calendar_source.dart';
import 'package:anifox/modules/schedule/models/services/calendar_service.dart';

final calendarServiceFactoryProvider = Provider<CalendarServiceFactory>((ref) {
  final http = ref.watch(httpClientProvider);
  return CalendarServiceFactory(http);
});

class CalendarServiceFactory {
  final HTTP _http;
  final Map<CalendarSource, CalendarService> _instances = {};

  CalendarServiceFactory(this._http);

  CalendarService getService(CalendarSource source) {
    return _instances.putIfAbsent(source, () {
      return switch (source) {
        CalendarSource.anilist => AnilistCalendarService(_http),
        CalendarSource.mal => MalCalendarService(_http),
        CalendarSource.simkl => SimklCalendarService(_http),
        CalendarSource.kitsu => KitsuCalendarService(_http),
      };
    });
  }
}
