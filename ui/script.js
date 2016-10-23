var $ = window.jQuery;

const canvasWidth = 300;
const canvasHeight = 250;
const gap = 2;
const bottomMargin = gap * 2;
const borderWidth = 0.5;
const lineColor = '#AAA';

const bars = [{
	key: 'adult_male_rmng_cap',
	total: 'tot_male_cap',
	label: 'Men',
	color: '#007CA6'
}, {
	key: 'adult_fmale_rmng_cap',
	total: 'tot_fmale_cap',
	label: 'Women',
	color: '#A10038',
}, {
	key: 'children_rmng_cap',
	total: 'tot_child_cap',
	label: 'Children',
	color: '#757302'
}, {
	key: 'abused_rmng_cap',
	total: 'tot_abused_cap',
	label: 'Abuse Victims',
	color: '#75025E'
}];

const filters = [{
	value: 'Saint Louis City'
}, {
	value: 'Saint Louis County'
}, {
	value: 'Saint Charles'
}, {
	value: 'All'
}];

var selectedFilter;

bars.forEach(bar => {
	var container = $('<div>').appendTo('#legend');
	container.append(bar.label);
	$('<div>').addClass('swatch').css({'background-color': bar.color}).appendTo(container);
});

filters.forEach(filter => {
	$('<div>').addClass('filterItem').text(filter.value).appendTo('#filters').data('filter', filter.value).on('click', function(){
		$(this).addClass('selected').siblings().removeClass('selected');
		selectedFilter = $(this).data('filter');

		var show = [];
		var hide = [];
		$('.chartContainer').each(function(){
			if (selectedFilter == 'All' || $(this).data('filter') == selectedFilter){
				show.push(this);
			} else {
				hide.push(this);
			}
		});

		console.log(show, hide);

		if (hide.length){
			$(hide).hide(250, function(){
				$(show).show(250);
			});
		} else {
			$(show).show(250);
		}

	});
});

var render = shelterData => {

	shelterData.forEach(row => {
		Object.keys(row).forEach(key => {
			if (!isNaN(row[key])) row[key] = parseFloat(row[key]);
		});
	});

	$('#stuffGoesHere').empty();

	shelterData.forEach(row => {

		var container = $('<div>').addClass('chartContainer col-md-4').appendTo('#stuffGoesHere').data('filter', row.county);

		var canvas = document.createElement('canvas');
		container.append(canvas);

		if (selectedFilter != 'All' && row.county != selectedFilter){
			container.hide();
		}

		$('<h3>').text(row.agency_name).appendTo(container);

		canvas.width = canvasWidth;
		canvas.height = canvasHeight;

		var T = canvas.getContext('2d');

		T.fillStyle = lineColor;
		T.fillRect(0, canvasHeight, canvasWidth, -gap * 2);
		T.fillRect(0, 0, gap * 2, canvasHeight);

		// var filteredBars = bars.filter(b => row[b.total]);
		var barWidth = (canvasWidth - bottomMargin - 2 * gap) / bars.length;
		bars.forEach((bar, i) => {

			var val = row[bar.key];

			// T.fillStyle = lineColor;
			// T.fillRect(i * barWidth + gap + bottomMargin, canvasHeight - bottomMargin - gap, barWidth - 2 * gap, -val);

			if (val - 2 * borderWidth > 0){
				T.fillStyle = bar.color;
				T.fillRect(i * barWidth + borderWidth + 2 * gap + bottomMargin, canvasHeight - bottomMargin - borderWidth - gap, barWidth - 2 * borderWidth - 2 * gap, -val + 2 * borderWidth);
			}

			if (row[bar.total]){
				T.fillStyle = lineColor;
				T.textAlign = 'center';
				T.font = '14px sans-serif';
				T.fillText(val, (i + 0.5) * barWidth + bottomMargin, canvasHeight - val - 10);
			}


		});

	});

};

var loop = () => {
	$.ajax({
		method: 'POST',
		headers: {'Content-Type': 'application/json'},
		url: 'http://f1b8272f.ngrok.io/select',
		data: JSON.stringify({SQL: 'SELECT agency_name, address, county, abused_rmng_cap, adult_fmale_rmng_cap, adult_male_rmng_cap, children_rmng_cap, tot_abused_cap, tot_male_cap, tot_fmale_cap, tot_child_cap FROM availability'})
	}, 'json').then(data => {

		if (!selectedFilter){
			var firstItem = $('.filterItem').first();
			firstItem.addClass('selected');
			selectedFilter = firstItem.data('filter');
		}
	
		render(data.data.sort((a, b) => a.agency_name < b.agency_name ? -1 : 1));
		setTimeout(loop, 10000);
	});
};


loop();
